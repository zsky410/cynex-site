import { after, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@cynex/db";
import { AuditAction, encrypt } from "@cynex/shared";
import { AuditService } from "../src/audit/audit.service";
import { AdminRevealService } from "../src/admin/inventory/admin-reveal.service";

const prisma = new PrismaClient();
const audit = new AuditService(prisma as any);
const service = new AdminRevealService(prisma as any, audit);

after(async () => {
  await prisma.$disconnect();
});

test("revealing an inventory account decrypts secrets and writes an ADMIN_VIEW_SECRET audit row", async () => {
  const admin = await prisma.admin.findFirstOrThrow();
  const variant = await prisma.productVariant.findFirstOrThrow();
  const account = await prisma.inventoryAccount.create({
    data: {
      productVariantId: variant.id,
      username: `reveal-account-${Date.now()}`,
      passwordEncrypted: encrypt("super-secret-password"),
      recoveryInfoEncrypted: encrypt("recovery@example.com"),
      noteEncrypted: encrypt("private account note"),
      publicNote: "public note",
      accountType: "dedicated",
      status: "available",
    },
  });

  try {
    const revealed = await service.revealAccount(admin.id, account.id);
    assert.equal(revealed.username, account.username);
    assert.equal(revealed.password, "super-secret-password");
    assert.equal(revealed.recoveryInfo, "recovery@example.com");
    assert.equal(revealed.privateNote, "private account note");

    const log = await prisma.auditLog.findFirstOrThrow({
      where: {
        actorId: admin.id,
        action: AuditAction.ADMIN_VIEW_SECRET,
        targetType: "inventory_account",
        targetId: account.id,
      },
      orderBy: { createdAt: "desc" },
    });
    assert.deepEqual(log.metadata, { resource: "inventory_account", fields: ["password", "recoveryInfo", "privateNote"] });
  } finally {
    await prisma.auditLog.deleteMany({ where: { targetId: account.id } });
    await prisma.inventoryAccount.delete({ where: { id: account.id } });
  }
});

test("revealing an inventory key decrypts the key and writes an ADMIN_VIEW_SECRET audit row", async () => {
  const admin = await prisma.admin.findFirstOrThrow();
  const variant = await prisma.productVariant.findFirstOrThrow();
  const key = await prisma.inventoryKey.create({
    data: {
      productVariantId: variant.id,
      keyEncrypted: encrypt("AAAA-BBBB-CCCC-DDDD"),
      publicNote: "gift card",
      status: "available",
    },
  });

  try {
    const revealed = await service.revealKey(admin.id, key.id);
    assert.equal(revealed.key, "AAAA-BBBB-CCCC-DDDD");
    assert.equal(revealed.publicNote, "gift card");

    const log = await prisma.auditLog.findFirstOrThrow({
      where: {
        actorId: admin.id,
        action: AuditAction.ADMIN_VIEW_SECRET,
        targetType: "inventory_key",
        targetId: key.id,
      },
      orderBy: { createdAt: "desc" },
    });
    assert.deepEqual(log.metadata, { resource: "inventory_key", fields: ["key"] });
  } finally {
    await prisma.auditLog.deleteMany({ where: { targetId: key.id } });
    await prisma.inventoryKey.delete({ where: { id: key.id } });
  }
});
