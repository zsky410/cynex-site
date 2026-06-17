import { after, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@cynex/db";
import { AdminDashboardController } from "../src/admin/dashboard/dashboard.controller";

const prisma = new PrismaClient();
const dashboard = new AdminDashboardController(prisma as any);

after(async () => {
  await prisma.$disconnect();
});

test("admin dashboard returns pending, processing, delivered-today, revenue, and stock counts", async () => {
  const baseline = await dashboard.get();
  const user = await prisma.user.create({
    data: { email: `dash-${Date.now()}@test.com`, passwordHash: "x" },
  });
  const variant = await prisma.productVariant.findFirstOrThrow();
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  const pending = await prisma.order.create({
    data: {
      orderCode: `DP${Date.now()}1`,
      userId: user.id,
      totalAmount: 10000,
      paymentStatus: "paid",
      fulfillmentStatus: "paid_waiting_admin",
      paidAt: now,
    },
  });
  const processing = await prisma.order.create({
    data: {
      orderCode: `DP${Date.now()}2`,
      userId: user.id,
      totalAmount: 20000,
      paymentStatus: "paid",
      fulfillmentStatus: "processing",
      paidAt: now,
    },
  });
  const assigned = await prisma.order.create({
    data: {
      orderCode: `DP${Date.now()}3`,
      userId: user.id,
      totalAmount: 30000,
      paymentStatus: "paid",
      fulfillmentStatus: "assigned",
      paidAt: now,
    },
  });
  const deliveredToday = await prisma.order.create({
    data: {
      orderCode: `DP${Date.now()}4`,
      userId: user.id,
      totalAmount: 40000,
      paymentStatus: "paid",
      fulfillmentStatus: "delivered",
      paidAt: now,
      deliveredAt: now,
    },
  });
  const deliveredYesterday = await prisma.order.create({
    data: {
      orderCode: `DP${Date.now()}5`,
      userId: user.id,
      totalAmount: 50000,
      paymentStatus: "paid",
      fulfillmentStatus: "delivered",
      paidAt: yesterday,
      deliveredAt: yesterday,
    },
  });
  const refunded = await prisma.order.create({
    data: {
      orderCode: `DP${Date.now()}6`,
      userId: user.id,
      totalAmount: 60000,
      paymentStatus: "refunded",
      fulfillmentStatus: "refunded",
      paidAt: now,
    },
  });

  const availableAccount = await prisma.inventoryAccount.create({
    data: {
      productVariantId: variant.id,
      username: `dash-acc-${Date.now()}`,
      passwordEncrypted: "encrypted",
      accountType: "dedicated",
      status: "available",
    },
  });
  const fullAccount = await prisma.inventoryAccount.create({
    data: {
      productVariantId: variant.id,
      username: `dash-full-${Date.now()}`,
      passwordEncrypted: "encrypted",
      accountType: "shared",
      maxSlots: 1,
      usedSlots: 1,
      status: "full",
    },
  });
  const availableKey = await prisma.inventoryKey.create({
    data: {
      productVariantId: variant.id,
      keyEncrypted: "encrypted",
      status: "available",
    },
  });
  const invalidKey = await prisma.inventoryKey.create({
    data: {
      productVariantId: variant.id,
      keyEncrypted: "encrypted",
      status: "invalid",
    },
  });

  try {
    const data = await dashboard.get();
    assert.equal(data.pending - baseline.pending, 1);
    assert.equal(data.processing - baseline.processing, 2);
    assert.equal(data.deliveredToday - baseline.deliveredToday, 1);
    assert.equal(data.revenue - baseline.revenue, 150000, "sum of currently paid orders only");
    assert.equal(data.stock.accountsAvailable - baseline.stock.accountsAvailable, 1);
    assert.equal(data.stock.keysAvailable - baseline.stock.keysAvailable, 1);
    assert.equal(data.stock.totalAvailable - baseline.stock.totalAvailable, 2);
  } finally {
    await prisma.inventoryKey.deleteMany({ where: { id: { in: [availableKey.id, invalidKey.id] } } });
    await prisma.inventoryAccount.deleteMany({ where: { id: { in: [availableAccount.id, fullAccount.id] } } });
    await prisma.order.deleteMany({
      where: { id: { in: [pending.id, processing.id, assigned.id, deliveredToday.id, deliveredYesterday.id, refunded.id] } },
    });
    await prisma.user.delete({ where: { id: user.id } });
  }
});
