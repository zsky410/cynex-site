import { after, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@cynex/db";
import { AdminUsersController } from "../src/admin/users/admin-users.controller";

const prisma = new PrismaClient();

after(async () => {
  await prisma.$disconnect();
});

test("deleting a user removes the row and dependent records from the database", async () => {
  const user = await prisma.user.create({
    data: {
      email: `delete-user-${Date.now()}@test.com`,
      passwordHash: "x",
      name: "Delete Me",
    },
    select: { id: true, isLocked: true },
  });

  const order = await prisma.order.create({
    data: {
      orderCode: `DEL${Date.now()}`,
      userId: user.id,
      totalAmount: 1000,
      paymentStatus: "paid",
      fulfillmentStatus: "assigned",
      paidAt: new Date(),
    },
    select: { id: true },
  });

  const item = await prisma.orderItem.create({
    data: {
      orderId: order.id,
      productId: (await prisma.product.findFirstOrThrow()).id,
      productVariantId: (await prisma.productVariant.findFirstOrThrow()).id,
      quantity: 1,
      unitPrice: 1000,
      totalPrice: 1000,
      fulfillmentType: "SHARED_ACCOUNT",
      status: "assigned",
    },
    select: { id: true },
  });

  const key = await prisma.inventoryKey.create({
    data: {
      productVariantId: (await prisma.productVariant.findFirstOrThrow()).id,
      keyEncrypted: "encrypted",
      soldOrderItemId: item.id,
      status: "assigned",
    },
    select: { id: true, soldOrderItemId: true },
  });

  await prisma.payment.create({
    data: {
      paymentCode: `PAY${Date.now()}`,
      userId: user.id,
      amount: 1000,
      provider: "payos",
      status: "paid",
    },
  });

  await prisma.walletTransaction.create({
    data: {
      userId: user.id,
      type: "refund",
      amount: 1000,
      balanceBefore: 0,
      balanceAfter: 1000,
    },
  });

  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: `token-${Date.now()}`,
      expiresAt: new Date(Date.now() + 60_000),
    },
  });

  await prisma.emailLog.create({
    data: {
      userId: user.id,
      type: "reset_password",
      toEmail: "test@example.com",
      subject: "Test",
      status: "sent",
    },
  });

  const controller = new AdminUsersController(prisma as any, {} as any, {} as any);

  try {
    const result = await controller.delete(user.id);
    const userCount = await prisma.user.count({ where: { id: user.id } });
    const orderCount = await prisma.order.count({ where: { id: order.id } });
    const paymentCount = await prisma.payment.count({ where: { userId: user.id } });
    const txnCount = await prisma.walletTransaction.count({ where: { userId: user.id } });
    const resetCount = await prisma.passwordResetToken.count({ where: { userId: user.id } });
    const emailCount = await prisma.emailLog.count({ where: { userId: user.id } });
    const fileCount = await prisma.fileObject.count({ where: { uploadedByUserId: user.id } });
    const keyAfter = await prisma.inventoryKey.findUniqueOrThrow({ where: { id: key.id } });
    const list = await controller.list({});

    assert.equal(result.data.id, user.id);
    assert.equal(userCount, 0);
    assert.equal(orderCount, 0);
    assert.equal(paymentCount, 0);
    assert.equal(txnCount, 0);
    assert.equal(resetCount, 0);
    assert.equal(emailCount, 0);
    assert.equal(fileCount, 0);
    assert.equal(keyAfter.soldOrderItemId, null);
    assert.ok(!list.data.some((row: { id: string }) => row.id === user.id));
  } finally {
    await prisma.inventoryKey.delete({ where: { id: key.id } });
    await prisma.orderItem.delete({ where: { id: item.id } }).catch(() => {});
    await prisma.order.delete({ where: { id: order.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    await prisma.payment.deleteMany({ where: { userId: user.id } }).catch(() => {});
    await prisma.walletTransaction.deleteMany({ where: { userId: user.id } }).catch(() => {});
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }).catch(() => {});
    await prisma.emailLog.deleteMany({ where: { userId: user.id } }).catch(() => {});
  }
});
