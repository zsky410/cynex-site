import { Injectable, NotFoundException } from "@nestjs/common";
import { AuditAction, decrypt, decryptNullable } from "@cynex/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../../audit/audit.service";

@Injectable()
export class AdminRevealService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async revealAccount(adminId: string, id: string) {
    const account = await this.prisma.inventoryAccount.findUnique({ where: { id } });
    if (!account) throw new NotFoundException("Tài khoản kho không tồn tại");

    const fields = ["password"] as string[];
    if (account.recoveryInfoEncrypted) fields.push("recoveryInfo");
    if (account.noteEncrypted) fields.push("privateNote");

    await this.audit.logAdminAction(
      adminId,
      AuditAction.ADMIN_VIEW_SECRET,
      "inventory_account",
      account.id,
      { resource: "inventory_account", fields },
    );

    return {
      id: account.id,
      username: account.username,
      password: decrypt(account.passwordEncrypted),
      recoveryInfo: decryptNullable(account.recoveryInfoEncrypted),
      privateNote: decryptNullable(account.noteEncrypted),
      publicNote: account.publicNote,
    };
  }

  async revealKey(adminId: string, id: string) {
    const key = await this.prisma.inventoryKey.findUnique({ where: { id } });
    if (!key) throw new NotFoundException("Key kho không tồn tại");

    await this.audit.logAdminAction(
      adminId,
      AuditAction.ADMIN_VIEW_SECRET,
      "inventory_key",
      key.id,
      { resource: "inventory_key", fields: ["key"] },
    );

    return {
      id: key.id,
      key: decrypt(key.keyEncrypted),
      publicNote: key.publicNote,
    };
  }
}
