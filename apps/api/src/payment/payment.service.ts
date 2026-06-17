import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { PayosService } from "./payos.service";
import { QueueService, EMAIL_JOB } from "../queue/queue.service";
import { WalletService } from "../wallet/wallet.service";
import { EmailType } from "@cynex/shared";

// payOS requires a numeric, unique order code. Build one that fits a JS safe int.
function genPayosOrderCode(): number {
  return Math.floor(Date.now() / 1000) * 1000 + Math.floor(Math.random() * 1000);
}

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly payos: PayosService,
    private readonly queue: QueueService,
    private readonly config: ConfigService,
    private readonly wallet: WalletService,
  ) {}

  async createDeposit(userId: string, amount: number) {
    const payosOrderCode = genPayosOrderCode();
    const payment = await this.prisma.payment.create({
      data: {
        paymentCode: String(payosOrderCode),
        userId,
        amount,
        provider: "payos",
        isDeposit: true,
        status: "pending",
      },
    });
    const link = await this.payos.createLink({
      payosOrderCode,
      amount,
      description: `Cynex nap ${payment.paymentCode}`,
      returnUrl: this.config.getOrThrow("PAYOS_RETURN_URL"),
      cancelUrl: this.config.getOrThrow("PAYOS_CANCEL_URL"),
    });
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { checkoutUrl: link.checkoutUrl, qrCode: link.qrCode, providerPaymentId: link.paymentLinkId },
    });
    return { checkoutUrl: link.checkoutUrl, qrCode: link.qrCode, paymentCode: payment.paymentCode };
  }

  async createOrderPayment(userId: string, orderCode: string) {
    const order = await this.prisma.order.findUnique({ where: { orderCode } });
    if (!order) throw new NotFoundException("Đơn hàng không tồn tại");
    if (order.userId !== userId) throw new ForbiddenException();
    if (order.paymentStatus !== "pending") {
      throw new BadRequestException("Đơn hàng không ở trạng thái chờ thanh toán");
    }

    // Reuse an existing pending payOS link if present (avoid duplicate payments).
    const existing = await this.prisma.payment.findFirst({
      where: { orderId: order.id, provider: "payos", status: "pending" },
    });
    if (existing?.checkoutUrl) {
      return { checkoutUrl: existing.checkoutUrl, qrCode: existing.qrCode, paymentCode: existing.paymentCode };
    }

    const payosOrderCode = genPayosOrderCode();
    const payment = await this.prisma.payment.create({
      data: {
        paymentCode: String(payosOrderCode),
        orderId: order.id,
        userId,
        amount: order.totalAmount,
        provider: "payos",
        status: "pending",
      },
    });

    const link = await this.payos.createLink({
      payosOrderCode,
      amount: order.totalAmount,
      description: `Cynex ${order.orderCode}`,
      returnUrl: this.config.getOrThrow("PAYOS_RETURN_URL"),
      cancelUrl: this.config.getOrThrow("PAYOS_CANCEL_URL"),
    });

    await this.prisma.payment.update({
      where: { id: payment.id },
      data: { checkoutUrl: link.checkoutUrl, qrCode: link.qrCode, providerPaymentId: link.paymentLinkId },
    });

    return { checkoutUrl: link.checkoutUrl, qrCode: link.qrCode, paymentCode: payment.paymentCode };
  }

  // Idempotent: a duplicate webhook for an already-paid payment is a no-op.
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
    if (payment.status === "paid") return { handled: true, duplicate: true };

    let didTransition = false;
    await this.prisma.$transaction(async (tx) => {
      const fresh = await tx.payment.findUnique({ where: { id: payment.id } });
      if (!fresh || fresh.status === "paid") return;

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
            paymentMethod: "payos",
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
          { referenceType: "payment", referenceId: fresh.id, description: "Nạp tiền payOS" },
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
