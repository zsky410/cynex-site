import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "node:crypto";
import type { Prisma } from "@cynex/db";
import { PrismaService } from "../prisma/prisma.service";
import { WalletService } from "../wallet/wallet.service";
import { QueueService, EMAIL_JOB } from "../queue/queue.service";
import { EmailType, decryptNullable, type CreateOrderDto } from "@cynex/shared";
import { assertValidCustomerInput } from "./customer-input";

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly queue: QueueService,
  ) {}

  private genOrderCode(): string {
    const ts = Date.now().toString(36).toUpperCase();
    const rnd = randomBytes(2).toString("hex").toUpperCase();
    return `CY${ts}${rnd}`;
  }

  async create(userId: string, dto: CreateOrderDto) {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: dto.productVariantId },
      include: { product: true },
    });
    if (!variant || variant.status === "archived" || variant.status === "inactive") {
      throw new BadRequestException("Gói sản phẩm không khả dụng");
    }
    if (variant.status === "out_of_stock") {
      throw new BadRequestException("Gói sản phẩm tạm hết hàng");
    }
    if (variant.requiresCustomerInput) {
      assertValidCustomerInput(
        variant.customerInputSchema as { fields?: Array<Record<string, unknown>> } | null | undefined,
        dto.customerInput,
      );
    }

    const quantity = dto.quantity ?? 1;
    const unitPrice = variant.price;
    const totalPrice = unitPrice * quantity;

    const order = await this.prisma.order.create({
      data: {
        orderCode: this.genOrderCode(),
        userId,
        totalAmount: totalPrice,
        paymentStatus: "pending",
        fulfillmentStatus: "waiting_payment",
        items: {
          create: {
            productId: variant.productId,
            productVariantId: variant.id,
            quantity,
            unitPrice,
            totalPrice,
            fulfillmentType: variant.fulfillmentType,
            customerInput: (dto.customerInput ?? undefined) as Prisma.InputJsonValue | undefined,
            status: "waiting_payment",
            // Every order item gets a fulfillment record up-front (PRD 18.1).
            fulfillment: {
              create: {
                fulfillmentType: variant.fulfillmentType,
                status: "waiting_payment",
              },
            },
          },
        },
      },
      include: { items: true },
    });
    return order;
  }

  // Pay an order entirely from the wallet. Balance debit, order transition and
  // ledger row are one atomic DB transaction (PRD 9.5 / 13.2).
  async payWithWallet(userId: string, orderCode: string) {
    const order = await this.prisma.order.findUnique({ where: { orderCode } });
    if (!order) throw new NotFoundException("Đơn hàng không tồn tại");
    if (order.userId !== userId) throw new ForbiddenException();
    if (order.paymentStatus !== "pending") {
      throw new BadRequestException("Đơn hàng không ở trạng thái chờ thanh toán");
    }

    await this.prisma.$transaction(async (tx) => {
      // Throws BadRequest if balance insufficient -> nothing is mutated.
      await this.wallet.debit(tx, userId, order.totalAmount, "purchase", {
        referenceType: "order",
        referenceId: order.id,
        description: `Thanh toán đơn ${order.orderCode}`,
      });
      await tx.payment.create({
        data: {
          paymentCode: `W${Date.now()}${Math.floor(Math.random() * 1000)}`,
          orderId: order.id,
          userId,
          amount: order.totalAmount,
          provider: "wallet",
          status: "paid",
          paidAt: new Date(),
        },
      });
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "paid",
          fulfillmentStatus: "paid_waiting_admin",
          paymentMethod: "wallet",
          paidAt: new Date(),
        },
      });
      const items = await tx.orderItem.findMany({ where: { orderId: order.id }, select: { id: true } });
      await tx.orderItem.updateMany({ where: { orderId: order.id }, data: { status: "paid_waiting_admin" } });
      await tx.orderFulfillment.updateMany({
        where: { orderItemId: { in: items.map((i) => i.id) } },
        data: { status: "paid_waiting_admin" },
      });
    });

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true, name: true },
    });
    await this.queue.enqueueEmail(
      EMAIL_JOB.paymentConfirmed,
      {
        type: EmailType.payment_confirmed,
        toEmail: user.email,
        userId,
        userName: user.name,
        orderId: order.id,
        orderCode: order.orderCode,
        totalAmount: order.totalAmount,
      },
      `payment-confirmed:wallet:${order.id}`,
    );
    return { ok: true };
  }

  list(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        items: { select: { id: true, productId: true, productVariantId: true, totalPrice: true } },
      },
    });
  }

  async getByCode(userId: string, orderCode: string) {
    const order = await this.prisma.order.findUnique({
      where: { orderCode },
      include: {
        items: {
          include: {
            variant: { select: { name: true, durationDays: true, warrantyDays: true } },
            product: { select: { name: true, slug: true } },
            fulfillment: true,
          },
        },
        payments: {
          select: { id: true, status: true, provider: true, amount: true },
        },
      },
    });
    if (!order) throw new NotFoundException("Đơn hàng không tồn tại");
    // Users may only ever read their own orders (PRD 9.6 / 20.3).
    if (order.userId !== userId) throw new ForbiddenException();

    // Never leak the ciphertext. Reveal the decrypted delivered secret only once
    // the item is delivered (PRD 18.6). The owner check above already passed.
    const items = order.items.map((it) => {
      const f = it.fulfillment;
      if (!f) return it;
      const { deliveredMessageEncrypted, ...rest } = f;
      const deliveredMessage =
        f.status === "delivered" ? decryptNullable(deliveredMessageEncrypted) : null;
      return { ...it, fulfillment: { ...rest, deliveredMessage } };
    });
    return { ...order, items };
  }
}
