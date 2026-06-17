import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@cynex/db";
import { decrypt, decryptNullable, encrypt, AuditAction } from "@cynex/shared";
import { PrismaService } from "../prisma/prisma.service";
import { AuditService } from "../audit/audit.service";

type Tx = Prisma.TransactionClient;

const ACTIVE_WARRANTY_STATUSES = new Set([
  "open",
  "waiting_admin",
  "waiting_customer",
  "processing",
]);

@Injectable()
export class WarrantyReplacementService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit?: AuditService,
  ) {}

  async replaceAccount(warrantyCaseId: string, inventoryAccountId: string, adminId: string) {
    const warrantyCase = await this.loadCaseOrThrow(warrantyCaseId);
    const fulfillment = warrantyCase.orderItem.fulfillment;
    if (!fulfillment) {
      throw new BadRequestException("Mục đơn hàng chưa có fulfillment để thay thế");
    }
    const account = await this.prisma.inventoryAccount.findUnique({
      where: { id: inventoryAccountId },
    });
    if (!account) {
      throw new NotFoundException("Tài khoản kho không tồn tại");
    }
    if (account.productVariantId !== warrantyCase.orderItem.productVariantId) {
      throw new BadRequestException("Tài khoản không khớp gói sản phẩm của đơn");
    }
    if (account.expiresAt && account.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException("Tài khoản đã hết hạn");
    }

    await this.prisma.$transaction(async (tx) => {
      await this.ensureReplaceableCase(tx, warrantyCaseId);
      await this.releaseOldAccount(tx, fulfillment.inventoryAccountId, fulfillment.accountAllocationId);

      if (account.accountType === "shared") {
        const claimed = await tx.inventoryAccount.updateMany({
          where: {
            id: account.id,
            usedSlots: { lt: account.maxSlots },
            status: { notIn: ["disabled", "expired", "replaced"] },
          },
          data: { usedSlots: { increment: 1 } },
        });
        if (claimed.count === 0) {
          throw new BadRequestException("Tài khoản chia sẻ đã đầy slot");
        }
      } else {
        const claimed = await tx.inventoryAccount.updateMany({
          where: { id: account.id, status: "available" },
          data: { status: "delivered" },
        });
        if (claimed.count === 0) {
          throw new BadRequestException("Tài khoản không khả dụng");
        }
      }

      const afterClaim = await tx.inventoryAccount.findUniqueOrThrow({
        where: { id: account.id },
      });
      if (account.accountType === "shared") {
        await tx.inventoryAccount.update({
          where: { id: account.id },
          data: {
            status: afterClaim.usedSlots >= afterClaim.maxSlots ? "full" : "available",
          },
        });
      }

      const allocation = await tx.accountAllocation.create({
        data: {
          inventoryAccountId: account.id,
          userId: warrantyCase.userId,
          orderItemId: warrantyCase.orderItemId,
          endsAt: account.expiresAt ?? undefined,
        },
      });

      await tx.orderFulfillment.update({
        where: { id: fulfillment.id },
        data: {
          inventoryAccountId: account.id,
          accountAllocationId: allocation.id,
          deliveredMessageEncrypted: encrypt(this.buildAccountMessage(account)),
          status: "delivered",
          deliveredAt: fulfillment.deliveredAt ?? new Date(),
        },
      });

      await tx.warrantyCase.update({
        where: { id: warrantyCase.id },
        data: {
          inventoryAccountId: account.id,
          sourceId: account.sourceId ?? warrantyCase.sourceId,
          status: "processing",
          closedAt: null,
        },
      });
    });

    await this.audit?.logAdminAction(
      adminId,
      AuditAction.ADMIN_REPLACE_WARRANTY_ITEM,
      "warranty_case",
      warrantyCase.id,
      {
        kind: "replace_account",
        orderItemId: warrantyCase.orderItemId,
        oldInventoryAccountId: fulfillment.inventoryAccountId,
        oldAccountAllocationId: fulfillment.accountAllocationId,
        newInventoryAccountId: inventoryAccountId,
      },
    );

    return this.prisma.warrantyCase.findUniqueOrThrow({ where: { id: warrantyCase.id } });
  }

  async replaceKey(warrantyCaseId: string, inventoryKeyId: string, adminId: string) {
    const warrantyCase = await this.loadCaseOrThrow(warrantyCaseId);
    const fulfillment = warrantyCase.orderItem.fulfillment;
    if (!fulfillment) {
      throw new BadRequestException("Mục đơn hàng chưa có fulfillment để thay thế");
    }
    const key = await this.prisma.inventoryKey.findUnique({
      where: { id: inventoryKeyId },
    });
    if (!key) {
      throw new NotFoundException("Key kho không tồn tại");
    }
    if (key.productVariantId !== warrantyCase.orderItem.productVariantId) {
      throw new BadRequestException("Key không khớp gói sản phẩm của đơn");
    }

    await this.prisma.$transaction(async (tx) => {
      await this.ensureReplaceableCase(tx, warrantyCaseId);

      if (fulfillment.inventoryKeyId) {
        await tx.inventoryKey.update({
          where: { id: fulfillment.inventoryKeyId },
          data: { status: "replaced", soldOrderItemId: null },
        });
      }

      const claimed = await tx.inventoryKey.updateMany({
        where: { id: key.id, status: "available" },
        data: {
          status: "delivered",
          soldOrderItemId: warrantyCase.orderItemId,
          deliveredAt: new Date(),
        },
      });
      if (claimed.count === 0) {
        throw new BadRequestException("Key không khả dụng");
      }

      await tx.orderFulfillment.update({
        where: { id: fulfillment.id },
        data: {
          inventoryKeyId: key.id,
          deliveredMessageEncrypted: encrypt(this.buildKeyMessage(key)),
          status: "delivered",
          deliveredAt: fulfillment.deliveredAt ?? new Date(),
        },
      });

      await tx.warrantyCase.update({
        where: { id: warrantyCase.id },
        data: {
          inventoryKeyId: key.id,
          sourceId: key.sourceId ?? warrantyCase.sourceId,
          status: "processing",
          closedAt: null,
        },
      });
    });

    await this.audit?.logAdminAction(
      adminId,
      AuditAction.ADMIN_REPLACE_WARRANTY_ITEM,
      "warranty_case",
      warrantyCase.id,
      {
        kind: "replace_key",
        orderItemId: warrantyCase.orderItemId,
        oldInventoryKeyId: fulfillment.inventoryKeyId,
        newInventoryKeyId: inventoryKeyId,
      },
    );

    return this.prisma.warrantyCase.findUniqueOrThrow({ where: { id: warrantyCase.id } });
  }

  private async loadCaseOrThrow(warrantyCaseId: string) {
    const warrantyCase = await this.prisma.warrantyCase.findUnique({
      where: { id: warrantyCaseId },
      include: {
        orderItem: {
          include: {
            fulfillment: true,
          },
        },
      },
    });
    if (!warrantyCase) {
      throw new NotFoundException("Yêu cầu bảo hành không tồn tại");
    }
    return warrantyCase;
  }

  private async ensureReplaceableCase(tx: Tx, warrantyCaseId: string) {
    const warrantyCase = await tx.warrantyCase.findUniqueOrThrow({
      where: { id: warrantyCaseId },
      select: { status: true },
    });
    if (!ACTIVE_WARRANTY_STATUSES.has(warrantyCase.status)) {
      throw new BadRequestException("Yêu cầu bảo hành đã đóng");
    }
  }

  private async releaseOldAccount(
    tx: Tx,
    inventoryAccountId?: string | null,
    accountAllocationId?: string | null,
  ) {
    if (accountAllocationId) {
      await tx.accountAllocation.update({
        where: { id: accountAllocationId },
        data: { status: "replaced", endsAt: new Date() },
      });
    }
    if (!inventoryAccountId) {
      return;
    }

    const oldAccount = await tx.inventoryAccount.findUnique({
      where: { id: inventoryAccountId },
    });
    if (!oldAccount) {
      return;
    }

    if (oldAccount.accountType === "shared") {
      const nextUsedSlots = Math.max(0, oldAccount.usedSlots - 1);
      await tx.inventoryAccount.update({
        where: { id: oldAccount.id },
        data: {
          usedSlots: nextUsedSlots,
          status: nextUsedSlots >= oldAccount.maxSlots ? "full" : "available",
        },
      });
      return;
    }

    await tx.inventoryAccount.update({
      where: { id: oldAccount.id },
      data: { status: "replaced" },
    });
  }

  private buildAccountMessage(account: {
    accountType: string;
    username: string;
    passwordEncrypted: string;
    recoveryInfoEncrypted: string | null;
    publicNote: string | null;
  }) {
    const lines = [
      `Loại: ${account.accountType === "shared" ? "Tài khoản dùng chung" : "Tài khoản dùng riêng"}`,
      `Tài khoản: ${account.username}`,
      `Mật khẩu: ${decrypt(account.passwordEncrypted)}`,
    ];
    const recovery = decryptNullable(account.recoveryInfoEncrypted);
    if (recovery) lines.push(`Thông tin khôi phục: ${recovery}`);
    if (account.publicNote) lines.push(`Ghi chú: ${account.publicNote}`);
    return lines.join("\n");
  }

  private buildKeyMessage(key: { keyEncrypted: string; publicNote: string | null }) {
    const lines = [`License key: ${decrypt(key.keyEncrypted)}`];
    if (key.publicNote) lines.push(`Ghi chú: ${key.publicNote}`);
    return lines.join("\n");
  }
}
