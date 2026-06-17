import { test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@cynex/db";
import { AuditAction, encrypt } from "@cynex/shared";
import { FulfillmentService } from "../src/admin/orders/fulfillment.service";
import { AuditService } from "../src/audit/audit.service";

const queueStub = { enqueueEmail: async () => {} } as any;

// Build a paid order with one item + fulfillment for `variantId`. Returns ids.
async function makeOrderItem(prisma: PrismaClient, userId: string, variantId: string) {
  const variant = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
  const order = await prisma.order.create({
    data: {
      orderCode: `FF${Date.now()}${Math.floor(Math.random() * 1e4)}`,
      userId,
      totalAmount: 1000,
      paymentStatus: "paid",
      fulfillmentStatus: "paid_waiting_admin",
      items: {
        create: {
          productId: variant.productId,
          productVariantId: variant.id,
          quantity: 1,
          unitPrice: 1000,
          totalPrice: 1000,
          fulfillmentType: variant.fulfillmentType,
          status: "paid_waiting_admin",
          fulfillment: {
            create: { fulfillmentType: variant.fulfillmentType, status: "paid_waiting_admin" },
          },
        },
      },
    },
    include: { items: { include: { fulfillment: true } } },
  });
  return { orderId: order.id, item: order.items[0]!, fulfillmentId: order.items[0]!.fulfillment!.id };
}

test("shared account capacity blocks oversell and flips to full", async () => {
  const prisma = new PrismaClient();
  const svc = new FulfillmentService(prisma as any, queueStub);

  const user = await prisma.user.create({
    data: { email: `ff-${Date.now()}@test.com`, passwordHash: "x" },
  });
  const variant = await prisma.productVariant.findFirstOrThrow();
  const account = await prisma.inventoryAccount.create({
    data: {
      productVariantId: variant.id,
      username: `shared-${Date.now()}`,
      passwordEncrypted: encrypt("secret"),
      accountType: "shared",
      maxSlots: 1,
      usedSlots: 0,
      status: "available",
    },
  });
  const a = await makeOrderItem(prisma, user.id, variant.id);
  const b = await makeOrderItem(prisma, user.id, variant.id);

  // First assignment consumes the only slot.
  await svc.assignAccount(a.fulfillmentId, account.id);
  const full = await prisma.inventoryAccount.findUniqueOrThrow({ where: { id: account.id } });
  assert.equal(full.usedSlots, 1);
  assert.equal(full.status, "full", "account is full at capacity");

  // Second assignment must be rejected — no oversell.
  await assert.rejects(() => svc.assignAccount(b.fulfillmentId, account.id), /đầy slot/);

  // Cleanup.
  await prisma.accountAllocation.deleteMany({ where: { inventoryAccountId: account.id } });
  await prisma.orderFulfillment.deleteMany({
    where: { orderItemId: { in: [a.item.id, b.item.id] } },
  });
  await prisma.orderItem.deleteMany({ where: { orderId: { in: [a.orderId, b.orderId] } } });
  await prisma.order.deleteMany({ where: { id: { in: [a.orderId, b.orderId] } } });
  await prisma.inventoryAccount.delete({ where: { id: account.id } });
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.$disconnect();
});

test("assigning an account of the wrong variant is rejected", async () => {
  const prisma = new PrismaClient();
  const svc = new FulfillmentService(prisma as any, queueStub);

  const variants = await prisma.productVariant.findMany({ take: 2 });
  assert.ok(variants.length >= 2, "seed must have >=2 variants");
  const [vA, vB] = variants;

  const user = await prisma.user.create({
    data: { email: `ffx-${Date.now()}@test.com`, passwordHash: "x" },
  });
  // Account belongs to variant B...
  const account = await prisma.inventoryAccount.create({
    data: {
      productVariantId: vB!.id,
      username: `ded-${Date.now()}`,
      passwordEncrypted: encrypt("secret"),
      accountType: "dedicated",
      status: "available",
    },
  });
  // ...but the order item is for variant A.
  const a = await makeOrderItem(prisma, user.id, vA!.id);

  await assert.rejects(() => svc.assignAccount(a.fulfillmentId, account.id), /khớp/);
  // The account must remain untouched.
  const fresh = await prisma.inventoryAccount.findUniqueOrThrow({ where: { id: account.id } });
  assert.equal(fresh.status, "available");

  await prisma.orderFulfillment.deleteMany({ where: { orderItemId: a.item.id } });
  await prisma.orderItem.deleteMany({ where: { orderId: a.orderId } });
  await prisma.order.delete({ where: { id: a.orderId } });
  await prisma.inventoryAccount.delete({ where: { id: account.id } });
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.$disconnect();
});

test("assigning an account with an admin id writes an ADMIN_ASSIGN_ACCOUNT audit row", async () => {
  const prisma = new PrismaClient();
  const audit = new AuditService(prisma as any);
  const svc = new FulfillmentService(prisma as any, queueStub, audit);

  const admin = await prisma.admin.findFirstOrThrow();
  const user = await prisma.user.create({
    data: { email: `ffa-${Date.now()}@test.com`, passwordHash: "x" },
  });
  const variant = await prisma.productVariant.findFirstOrThrow();
  const account = await prisma.inventoryAccount.create({
    data: {
      productVariantId: variant.id,
      username: `audit-shared-${Date.now()}`,
      passwordEncrypted: encrypt("secret"),
      accountType: "dedicated",
      status: "available",
    },
  });
  const a = await makeOrderItem(prisma, user.id, variant.id);

  await svc.assignAccount(a.fulfillmentId, account.id, admin.id);

  const log = await prisma.auditLog.findFirstOrThrow({
    where: {
      actorId: admin.id,
      action: AuditAction.ADMIN_ASSIGN_ACCOUNT,
      targetType: "order_fulfillment",
      targetId: a.fulfillmentId,
    },
    orderBy: { createdAt: "desc" },
  });
  assert.equal((log.metadata as any).inventoryAccountId, account.id);

  await prisma.auditLog.deleteMany({ where: { targetId: a.fulfillmentId } });
  await prisma.accountAllocation.deleteMany({ where: { inventoryAccountId: account.id } });
  await prisma.orderFulfillment.deleteMany({ where: { orderItemId: a.item.id } });
  await prisma.orderItem.deleteMany({ where: { orderId: a.orderId } });
  await prisma.order.delete({ where: { id: a.orderId } });
  await prisma.inventoryAccount.delete({ where: { id: account.id } });
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.$disconnect();
});
