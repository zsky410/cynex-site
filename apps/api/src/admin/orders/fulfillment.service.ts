import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import type { Prisma } from "@cynex/db";
import {
  decrypt,
  decryptNullable,
  encrypt,
  leastAdvancedFulfillment,
  EMAIL_JOB,
  EmailType,
  type FulfillmentStatus,
} from "@cynex/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { QueueService } from "../../queue/queue.service";
import { deliveryEmail } from "./delivery-template";
import { AuditService } from "../../audit/audit.service";
import { AuditAction } from "@cynex/shared";

// Statuses from which an item may still be (re)assigned. Once delivered/refunded/
// cancelled it is locked.
const ASSIGNABLE: FulfillmentStatus[] = ["paid_waiting_admin", "processing", "assigned"];

type Tx = Prisma.TransactionClient;

@Injectable()
export class FulfillmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly audit?: AuditService,
  ) {}

  private async loadOrThrow(fulfillmentId: string) {
    const f = await this.prisma.orderFulfillment.findUnique({
      where: { id: fulfillmentId },
      include: { orderItem: { include: { order: { include: { user: true } } } } },
    });
    if (!f) throw new NotFoundException("Fulfillment không tồn tại");
    return f;
  }

  // Roll the parent order's fulfillmentStatus up to the least-advanced item.
  private async recomputeOrder(tx: Tx, orderId: string) {
    const items = await tx.orderItem.findMany({
      where: { orderId },
      select: { fulfillment: { select: { status: true } } },
    });
    const statuses = items
      .map((i) => i.fulfillment?.status)
      .filter((s): s is FulfillmentStatus => !!s);
    const rolled = leastAdvancedFulfillment(statuses);
    if (!rolled) return;
    await tx.order.update({
      where: { id: orderId },
      data: {
        fulfillmentStatus: rolled,
        ...(rolled === "delivered" ? { deliveredAt: new Date() } : {}),
      },
    });
  }

  async markProcessing(fulfillmentId: string) {
    const f = await this.loadOrThrow(fulfillmentId);
    if (!["paid_waiting_admin", "processing"].includes(f.status)) {
      throw new BadRequestException("Đơn chưa thanh toán hoặc đã xử lý xong");
    }
    return this.prisma.$transaction(async (tx) => {
      await tx.orderFulfillment.update({ where: { id: f.id }, data: { status: "processing" } });
      await tx.orderItem.update({ where: { id: f.orderItemId }, data: { status: "processing" } });
      await this.recomputeOrder(tx, f.orderItem.orderId);
      return { ok: true };
    });
  }

  // Assign a dedicated OR shared account. Branches on the account's accountType.
  async assignAccount(fulfillmentId: string, inventoryAccountId: string, adminId?: string) {
    const f = await this.loadOrThrow(fulfillmentId);
    if (!ASSIGNABLE.includes(f.status)) throw new BadRequestException("Item không thể gán lúc này");
    if (f.accountAllocationId || f.inventoryAccountId) {
      throw new BadRequestException("Item đã được gán tài khoản, hãy gỡ trước khi gán lại");
    }
    const account = await this.prisma.inventoryAccount.findUnique({ where: { id: inventoryAccountId } });
    if (!account) throw new NotFoundException("Tài khoản kho không tồn tại");
    if (account.productVariantId !== f.orderItem.productVariantId) {
      throw new BadRequestException("Tài khoản không khớp gói sản phẩm của đơn");
    }
    if (account.expiresAt && account.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException("Tài khoản đã hết hạn");
    }

    return this.prisma.$transaction(async (tx) => {
      if (account.accountType === "shared") {
        // Atomic guard against over-selling: only consume a slot if one is free.
        const claimed = await tx.inventoryAccount.updateMany({
          where: {
            id: account.id,
            usedSlots: { lt: account.maxSlots },
            status: { notIn: ["full", "disabled", "expired", "replaced"] },
          },
          data: { usedSlots: { increment: 1 } },
        });
        if (claimed.count === 0) throw new BadRequestException("Tài khoản chia sẻ đã đầy slot");
        // Mark full once the last slot is taken.
        const after = await tx.inventoryAccount.findUniqueOrThrow({ where: { id: account.id } });
        if (after.usedSlots >= after.maxSlots) {
          await tx.inventoryAccount.update({ where: { id: account.id }, data: { status: "full" } });
        }
      } else {
        const claimed = await tx.inventoryAccount.updateMany({
          where: { id: account.id, status: "available" },
          data: { status: "assigned" },
        });
        if (claimed.count === 0) throw new BadRequestException("Tài khoản không khả dụng");
      }

      const allocation = await tx.accountAllocation.create({
        data: {
          inventoryAccountId: account.id,
          userId: f.orderItem.order.userId,
          orderItemId: f.orderItemId,
          endsAt: account.expiresAt ?? undefined,
        },
      });

      const message = this.buildAccountMessage(account);
      await tx.orderFulfillment.update({
        where: { id: f.id },
        data: {
          inventoryAccountId: account.id,
          accountAllocationId: allocation.id,
          deliveredMessageEncrypted: encrypt(message),
          status: "assigned",
        },
      });
      await tx.orderItem.update({ where: { id: f.orderItemId }, data: { status: "assigned" } });
      await this.recomputeOrder(tx, f.orderItem.orderId);
      if (adminId) {
        await this.audit?.logAdminAction(
          adminId,
          AuditAction.ADMIN_ASSIGN_ACCOUNT,
          "order_fulfillment",
          f.id,
          {
            inventoryAccountId: account.id,
            accountType: account.accountType,
            orderItemId: f.orderItemId,
          },
        );
      }
      return { ok: true, allocationId: allocation.id };
    });
  }

  async assignKey(fulfillmentId: string, inventoryKeyId: string, adminId?: string) {
    const f = await this.loadOrThrow(fulfillmentId);
    if (!ASSIGNABLE.includes(f.status)) throw new BadRequestException("Item không thể gán lúc này");
    if (f.inventoryKeyId) throw new BadRequestException("Item đã được gán key");
    const key = await this.prisma.inventoryKey.findUnique({ where: { id: inventoryKeyId } });
    if (!key) throw new NotFoundException("Key kho không tồn tại");
    if (key.productVariantId !== f.orderItem.productVariantId) {
      throw new BadRequestException("Key không khớp gói sản phẩm của đơn");
    }

    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.inventoryKey.updateMany({
        where: { id: key.id, status: "available" },
        data: { status: "assigned", soldOrderItemId: f.orderItemId },
      });
      if (claimed.count === 0) throw new BadRequestException("Key không khả dụng");

      const message = this.buildKeyMessage(key);
      await tx.orderFulfillment.update({
        where: { id: f.id },
        data: {
          inventoryKeyId: key.id,
          deliveredMessageEncrypted: encrypt(message),
          status: "assigned",
        },
      });
      await tx.orderItem.update({ where: { id: f.orderItemId }, data: { status: "assigned" } });
      await this.recomputeOrder(tx, f.orderItem.orderId);
      if (adminId) {
        await this.audit?.logAdminAction(
          adminId,
          AuditAction.ADMIN_ASSIGN_KEY,
          "order_fulfillment",
          f.id,
          {
            inventoryKeyId: key.id,
            orderItemId: f.orderItemId,
          },
        );
      }
      return { ok: true };
    });
  }

  // Manual / upgrade fulfillment: free-text note becomes the delivered secret.
  async setManual(fulfillmentId: string, note: string) {
    const trimmed = (note ?? "").trim();
    if (!trimmed) throw new BadRequestException("Nội dung giao hàng là bắt buộc");
    const f = await this.loadOrThrow(fulfillmentId);
    if (!ASSIGNABLE.includes(f.status)) throw new BadRequestException("Item không thể gán lúc này");
    return this.prisma.$transaction(async (tx) => {
      await tx.orderFulfillment.update({
        where: { id: f.id },
        data: {
          manualNote: trimmed,
          deliveredMessageEncrypted: encrypt(trimmed),
          status: "assigned",
        },
      });
      await tx.orderItem.update({ where: { id: f.orderItemId }, data: { status: "assigned" } });
      await this.recomputeOrder(tx, f.orderItem.orderId);
      return { ok: true };
    });
  }

  // Render the delivery email + show the (decrypted) delivered message so the admin
  // can verify content BEFORE sending. Sends nothing, writes no email_logs row.
  async previewDelivery(fulfillmentId: string) {
    const f = await this.loadOrThrow(fulfillmentId);
    if (!f.deliveredMessageEncrypted) {
      throw new BadRequestException("Chưa có nội dung giao — hãy gán tài khoản/key/ghi chú trước");
    }
    const { subject, html } = deliveryEmail({ orderCode: f.orderItem.order.orderCode });
    return { subject, html, deliveredMessage: decrypt(f.deliveredMessageEncrypted) };
  }

  // Enqueue the delivery email. The fulfillment only flips to "delivered" once the
  // worker confirms the email actually sent (PRD 18.4). A resend of an already-sent
  // item requires confirm=true to avoid accidental double-sends.
  async sendDelivery(fulfillmentId: string, adminId: string, confirm: boolean) {
    const f = await this.loadOrThrow(fulfillmentId);
    if (!f.deliveredMessageEncrypted) {
      throw new BadRequestException("Chưa có nội dung giao — hãy gán tài khoản/key/ghi chú trước");
    }
    if (f.status !== "assigned" && !(f.status === "delivered" && confirm)) {
      if (f.status === "delivered") {
        throw new BadRequestException("Đã giao rồi. Gửi lại cần xác nhận (confirm=true)");
      }
      throw new BadRequestException("Item chưa được gán, không thể giao");
    }

    const resend = f.status === "delivered";
    // First send is idempotent against BullMQ retries; a confirmed resend gets a
    // fresh dedupe key so a brand-new email is actually delivered.
    const dedupeKey = resend ? `delivery:${f.id}:${Date.now()}` : `delivery:${f.id}`;

    await this.prisma.orderFulfillment.update({
      where: { id: f.id },
      data: { emailSentByAdminId: adminId, deliveredByAdminId: adminId },
    });
    await this.queue.enqueueEmail(
      EMAIL_JOB.delivery,
      {
        type: EmailType.delivery,
        fulfillmentId: f.id,
        orderId: f.orderItem.orderId,
        orderCode: f.orderItem.order.orderCode,
        toEmail: f.orderItem.order.user.email,
        userId: f.orderItem.order.userId,
        dedupeKey,
      },
      // BullMQ rejects ":" in custom job ids; email_logs still dedupes on dedupeKey.
      dedupeKey.replaceAll(":", "-"),
    );
    await this.audit?.logAdminAction(
      adminId,
      AuditAction.ADMIN_SEND_DELIVERY_EMAIL,
      "order_fulfillment",
      f.id,
      {
        orderId: f.orderItem.orderId,
        orderCode: f.orderItem.order.orderCode,
        resend,
      },
    );
    return { ok: true, resend };
  }

  private buildAccountMessage(a: {
    accountType: string;
    username: string;
    passwordEncrypted: string;
    recoveryInfoEncrypted: string | null;
    publicNote: string | null;
  }): string {
    const lines = [
      `Loại: ${a.accountType === "shared" ? "Tài khoản dùng chung" : "Tài khoản dùng riêng"}`,
      `Tài khoản: ${a.username}`,
      `Mật khẩu: ${decrypt(a.passwordEncrypted)}`,
    ];
    const recovery = decryptNullable(a.recoveryInfoEncrypted);
    if (recovery) lines.push(`Thông tin khôi phục: ${recovery}`);
    if (a.publicNote) lines.push(`Ghi chú: ${a.publicNote}`);
    return lines.join("\n");
  }

  private buildKeyMessage(k: { keyEncrypted: string; publicNote: string | null }): string {
    const lines = [`License key: ${decrypt(k.keyEncrypted)}`];
    if (k.publicNote) lines.push(`Ghi chú: ${k.publicNote}`);
    return lines.join("\n");
  }
}
