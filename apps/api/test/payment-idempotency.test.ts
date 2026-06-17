import { test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@cynex/db";
import { PaymentService } from "../src/payment/payment.service";
import { WalletService } from "../src/wallet/wallet.service";

// Verifies PRD 9.4 / 12.3: a duplicate paid webhook must not double-process the
// order nor send the confirmation email twice.
test("markPaid is idempotent for order payments", async () => {
  const prisma = new PrismaClient();
  const wallet = new WalletService(prisma as any);

  let emailCalls = 0;
  const queueStub = {
    enqueueEmail: async () => {
      emailCalls += 1;
    },
  };
  const service = new PaymentService(
    prisma as any,
    {} as any, // payos (unused here)
    queueStub as any,
    {} as any, // config (unused here)
    wallet,
  );

  // Arrange: a user, an order with one item+fulfillment, and a pending payment.
  const user = await prisma.user.create({
    data: { email: `idem-${Date.now()}@test.com`, passwordHash: "x" },
  });
  const variant = await prisma.productVariant.findFirstOrThrow();
  const order = await prisma.order.create({
    data: {
      orderCode: `IDEM${Date.now()}`,
      userId: user.id,
      totalAmount: 35000,
      items: {
        create: {
          productId: variant.productId,
          productVariantId: variant.id,
          quantity: 1,
          unitPrice: 35000,
          totalPrice: 35000,
          fulfillmentType: variant.fulfillmentType,
          fulfillment: { create: { fulfillmentType: variant.fulfillmentType } },
        },
      },
    },
  });
  const paymentCode = `PC${Date.now()}`;
  await prisma.payment.create({
    data: {
      paymentCode,
      orderId: order.id,
      userId: user.id,
      amount: 35000,
      provider: "payos",
      status: "pending",
    },
  });

  // Act: deliver the same webhook twice.
  const r1 = await service.markPaid(paymentCode, "txn-1", { foo: "bar" });
  const r2 = await service.markPaid(paymentCode, "txn-1", { foo: "bar" });

  // Assert.
  assert.equal(r1.handled, true);
  assert.equal(r1.duplicate, undefined);
  assert.equal(r2.duplicate, true);
  assert.equal(emailCalls, 1, "confirmation email enqueued exactly once");

  const freshOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
  assert.equal(freshOrder.paymentStatus, "paid");
  assert.equal(freshOrder.fulfillmentStatus, "paid_waiting_admin");

  const ff = await prisma.orderFulfillment.findFirstOrThrow({
    where: { orderItem: { orderId: order.id } },
  });
  assert.equal(ff.status, "paid_waiting_admin");

  // Cleanup.
  await prisma.payment.deleteMany({ where: { orderId: order.id } });
  await prisma.orderFulfillment.deleteMany({ where: { orderItem: { orderId: order.id } } });
  await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
  await prisma.order.delete({ where: { id: order.id } });
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.$disconnect();
});

// Verifies PRD 13.1: a paid deposit credits the wallet exactly once, atomically.
test("markPaid credits wallet for deposits and is idempotent", async () => {
  const prisma = new PrismaClient();
  const wallet = new WalletService(prisma as any);
  let emailCalls = 0;
  const queueStub = { enqueueEmail: async () => { emailCalls += 1; } };
  const service = new PaymentService(prisma as any, {} as any, queueStub as any, {} as any, wallet);

  const user = await prisma.user.create({
    data: { email: `dep-${Date.now()}@test.com`, passwordHash: "x", walletBalance: 5000 },
  });
  const paymentCode = `DEP${Date.now()}`;
  await prisma.payment.create({
    data: {
      paymentCode,
      userId: user.id,
      amount: 50000,
      provider: "payos",
      isDeposit: true,
      status: "pending",
    },
  });

  await service.markPaid(paymentCode, "txn-dep", { ok: true });
  const r2 = await service.markPaid(paymentCode, "txn-dep", { ok: true });

  assert.equal(r2.duplicate, true);
  assert.equal(emailCalls, 1);
  const fresh = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
  assert.equal(fresh.walletBalance, 55000, "5000 + 50000 deposit");
  const txns = await prisma.walletTransaction.findMany({ where: { userId: user.id } });
  assert.equal(txns.length, 1, "exactly one ledger row");
  assert.equal(txns[0]!.type, "deposit");

  await prisma.walletTransaction.deleteMany({ where: { userId: user.id } });
  await prisma.payment.deleteMany({ where: { userId: user.id } });
  await prisma.user.delete({ where: { id: user.id } });
  await prisma.$disconnect();
});
