import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { AuditAction, EMAIL_JOB, EmailType } from "@cynex/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { WalletService } from "../../wallet/wallet.service";
import { QueueService } from "../../queue/queue.service";
import { AuditService } from "../../audit/audit.service";

@Injectable()
export class AdminRefundService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly queue: QueueService,
    private readonly audit: AuditService,
  ) {}

  async refundOrder(adminId: string, orderId: string, body: { reason?: string }) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { id: true, email: true, walletBalance: true } },
        items: { select: { id: true } },
        payments: true,
      },
    });
    if (!order) throw new NotFoundException("Đơn hàng không tồn tại");
    if (order.paymentStatus === "refunded") {
      throw new BadRequestException("Đơn hàng đã được hoàn tiền");
    }
    if (order.paymentStatus !== "paid") {
      throw new BadRequestException("Chỉ hoàn tiền cho đơn đã thanh toán");
    }

    const reason = body.reason?.trim();
    let balanceAfter = order.user.walletBalance;

    await this.prisma.$transaction(async (tx) => {
      balanceAfter = await this.wallet.credit(tx, order.userId, order.totalAmount, "refund", {
        referenceType: "order",
        referenceId: order.id,
        description: reason ? `Refund order ${order.orderCode}: ${reason}` : `Refund order ${order.orderCode}`,
        createdByAdminId: adminId,
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "refunded",
          fulfillmentStatus: "refunded",
        },
      });
      await tx.orderItem.updateMany({
        where: { orderId: order.id },
        data: { status: "refunded" },
      });
      await tx.orderFulfillment.updateMany({
        where: { orderItemId: { in: order.items.map((item) => item.id) } },
        data: { status: "refunded" },
      });
      await tx.payment.updateMany({
        where: { orderId: order.id, status: "paid" },
        data: { status: "refunded" },
      });
    });

    await this.queue.enqueueEmail(
      EMAIL_JOB.refund,
      {
        type: EmailType.refund,
        toEmail: order.user.email,
        userId: order.user.id,
        orderId: order.id,
        orderCode: order.orderCode,
        amount: order.totalAmount,
        reason,
        balanceAfter,
        sentByAdminId: adminId,
      },
      `refund-${order.id}`,
    );
    await this.audit.logAdminAction(adminId, AuditAction.ADMIN_REFUND_ORDER, "order", order.id, {
      orderCode: order.orderCode,
      amount: order.totalAmount,
      reason,
      balanceAfter,
    });

    return { ok: true, orderId: order.id, balanceAfter };
  }
}
