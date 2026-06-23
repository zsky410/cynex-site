import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { QueueService, EMAIL_JOB } from "../queue/queue.service";
import { WalletService } from "../wallet/wallet.service";
import { EmailType } from "@cynex/shared";
import { SepayService } from "./sepay.service";

function genSepayPaymentCode(): string {
  return `SEP${Date.now()}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0")}`;
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly sepay: SepayService,
    private readonly queue: QueueService,
    private readonly config: ConfigService,
    private readonly wallet: WalletService,
  ) {}

  async createDeposit(userId: string, amount: number) {
    const paymentCode = genSepayPaymentCode();
    const payload = this.sepay.createPaymentPayload({
      paymentCode,
      amount,
    });

    const payment = await this.prisma.$transaction(async (tx) => {
      await tx.payment.updateMany({
        where: {
          userId,
          isDeposit: true,
          provider: "sepay",
          status: "pending",
        },
        data: {
          status: "cancelled",
        },
      });

      return tx.payment.create({
        data: {
          paymentCode,
          userId,
          amount,
          provider: "sepay",
          isDeposit: true,
          status: "pending",
          qrCode: payload.qrCode,
        },
      });
    });

    return {
      ...payload,
      paymentCode: payment.paymentCode,
    };
  }

  async createOrderPayment(userId: string, orderCode: string) {
    const order = await this.prisma.order.findUnique({ where: { orderCode } });
    if (!order) throw new NotFoundException("Đơn hàng không tồn tại");
    if (order.userId !== userId) throw new ForbiddenException();
    if (order.paymentStatus !== "pending") {
      throw new BadRequestException("Đơn hàng không ở trạng thái chờ thanh toán");
    }

    const paymentCode = genSepayPaymentCode();
    const payload = this.sepay.createPaymentPayload({
      paymentCode,
      amount: order.totalAmount,
    });

    const payment = await this.prisma.$transaction(async (tx) => {
      await tx.payment.updateMany({
        where: {
          orderId: order.id,
          provider: "sepay",
          status: "pending",
        },
        data: {
          status: "cancelled",
        },
      });

      return tx.payment.create({
        data: {
          paymentCode,
          orderId: order.id,
          userId,
          amount: order.totalAmount,
          provider: "sepay",
          status: "pending",
          qrCode: payload.qrCode,
        },
      });
    });

    return {
      ...payload,
      paymentCode: payment.paymentCode,
    };
  }

  // Idempotent: a duplicate webhook for an already-paid payment is a no-op.
  async findPendingPayment(paymentCode: string) {
    return this.prisma.payment.findFirst({
      where: { paymentCode, status: "pending" },
    });
  }

  async markPaid(
    paymentCode: string,
    providerTransactionId: string | undefined,
    rawPayload: unknown,
  ): Promise<{ handled: boolean; duplicate?: boolean }> {
    const payment = await this.prisma.payment.findUnique({ where: { paymentCode } });
    if (!payment) {
      this.logger.warn(`webhook for unknown paymentCode ${paymentCode}`);
      return { handled: false };
    }
    if (payment.status !== "pending") return { handled: true, duplicate: true };

    let didTransition = false;
    await this.prisma.$transaction(async (tx) => {
      const fresh = await tx.payment.findUnique({ where: { id: payment.id } });
      if (!fresh || fresh.status !== "pending") return;

      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: "paid",
          providerTransactionId: providerTransactionId ?? fresh.providerTransactionId,
          paidAt: new Date(),
          rawWebhookPayload: rawPayload as object,
        },
      });

      if (fresh.orderId) {
        await tx.order.update({
          where: { id: fresh.orderId },
          data: {
            paymentStatus: "paid",
            fulfillmentStatus: "paid_waiting_admin",
            paymentMethod: "sepay",
            paidAt: new Date(),
          },
        });
        const items = await tx.orderItem.findMany({
          where: { orderId: fresh.orderId },
          select: { id: true },
        });
        const itemIds = items.map((i) => i.id);
        await tx.orderItem.updateMany({
          where: { orderId: fresh.orderId },
          data: { status: "paid_waiting_admin" },
        });
        await tx.orderFulfillment.updateMany({
          where: { orderItemId: { in: itemIds } },
          data: { status: "paid_waiting_admin" },
        });
      } else if (fresh.isDeposit) {
        await this.wallet.credit(
          tx,
          fresh.userId,
          fresh.amount,
          "deposit",
          { referenceType: "payment", referenceId: fresh.id, description: "Nạp tiền SePay" },
        );
      }
      didTransition = true;
    });

    if (!didTransition) return { handled: true, duplicate: true };
    await this.afterPaid(payment.id);
    return { handled: true };
  }

  // Enqueue the proper confirmation email exactly once (BullMQ jobId dedupe).
  private async afterPaid(paymentId: string): Promise<void> {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: { select: { email: true, name: true, walletBalance: true } },
        order: { select: { orderCode: true, totalAmount: true } },
      },
    });
    if (!payment) return;

    if (payment.isDeposit) {
      await this.queue.enqueueEmail(
        EMAIL_JOB.walletDeposit,
        {
          type: EmailType.wallet_deposit_confirmed,
          toEmail: payment.user.email,
          userId: payment.userId,
          amount: payment.amount,
          balanceAfter: payment.user.walletBalance,
          paymentCode: payment.paymentCode,
        },
        `wallet-deposit:${payment.id}`,
      );
    } else if (payment.order) {
      await this.queue.enqueueEmail(
        EMAIL_JOB.paymentConfirmed,
        {
          type: EmailType.payment_confirmed,
          toEmail: payment.user.email,
          userId: payment.userId,
          userName: payment.user.name,
          orderId: payment.orderId,
          orderCode: payment.order.orderCode,
          totalAmount: payment.order.totalAmount,
        },
        `payment-confirmed:${payment.id}`,
      );
    }
  }
}
