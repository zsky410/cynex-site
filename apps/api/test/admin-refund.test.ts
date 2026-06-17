import { after, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@cynex/db";
import { AuditAction, EMAIL_JOB } from "@cynex/shared";
import { WalletService } from "../src/wallet/wallet.service";
import { AuditService } from "../src/audit/audit.service";
import { AdminRefundService } from "../src/admin/orders/admin-refund.service";

const prisma = new PrismaClient();

after(async () => {
  await prisma.$disconnect();
});

async function makePaidOrder(userId: string) {
  const variant = await prisma.productVariant.findFirstOrThrow();
  const order = await prisma.order.create({
    data: {
      orderCode: `RF${Date.now()}${Math.floor(Math.random() * 1e4)}`,
      userId,
      totalAmount: variant.price,
      paymentStatus: "paid",
      fulfillmentStatus: "paid_waiting_admin",
      paymentMethod: "wallet",
      paidAt: new Date(),
      items: {
        create: {
          productId: variant.productId,
          productVariantId: variant.id,
          quantity: 1,
          unitPrice: variant.price,
          totalPrice: variant.price,
          fulfillmentType: variant.fulfillmentType,
          status: "paid_waiting_admin",
          fulfillment: {
            create: {
              fulfillmentType: variant.fulfillmentType,
              status: "paid_waiting_admin",
            },
          },
        },
      },
      payments: {
        create: {
          paymentCode: `PM${Date.now()}${Math.floor(Math.random() * 1e4)}`,
          userId,
          amount: variant.price,
          provider: "wallet",
          status: "paid",
          paidAt: new Date(),
        },
      },
    },
    include: { items: { include: { fulfillment: true } }, payments: true },
  });
  return { order, item: order.items[0]!, fulfillment: order.items[0]!.fulfillment!, payment: order.payments[0]! };
}

async function cleanupOrder(orderId: string, userId: string) {
  await prisma.auditLog.deleteMany({ where: { targetId: orderId } });
  await prisma.emailLog.deleteMany({ where: { orderId } });
  await prisma.walletTransaction.deleteMany({ where: { userId, referenceId: orderId } });
  await prisma.payment.deleteMany({ where: { orderId } });
  await prisma.orderFulfillment.deleteMany({ where: { orderItem: { orderId } } });
  await prisma.orderItem.deleteMany({ where: { orderId } });
  await prisma.order.delete({ where: { id: orderId } });
}

test("refunding an order credits the wallet, marks the order refunded, enqueues refund email, and writes audit", async () => {
  const admin = await prisma.admin.findFirstOrThrow();
  const user = await prisma.user.create({
    data: { email: `refund-${Date.now()}@test.com`, passwordHash: "x", walletBalance: 5000 },
  });

  let queued: { name: string; data: any; jobId?: string } | null = null;
  const queueStub = {
    enqueueEmail: async (name: string, data: any, jobId?: string) => {
      queued = { name, data, jobId };
    },
  };
  const wallet = new WalletService(prisma as any);
  const audit = new AuditService(prisma as any);
  const service = new AdminRefundService(prisma as any, wallet, queueStub as any, audit);
  const { order, payment } = await makePaidOrder(user.id);

  try {
    const result = await service.refundOrder(admin.id, order.id, {
      reason: "Customer requested cancellation",
    });

    assert.equal(result.balanceAfter, 5000 + order.totalAmount);
    assert.equal(result.orderId, order.id);
    assert.equal(queued?.name, EMAIL_JOB.refund);
    assert.equal(queued?.data.orderCode, order.orderCode);
    assert.equal(queued?.data.reason, "Customer requested cancellation");

    const freshOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(freshOrder.paymentStatus, "refunded");
    assert.equal(freshOrder.fulfillmentStatus, "refunded");

    const item = await prisma.orderItem.findUniqueOrThrow({ where: { id: order.items[0]!.id } });
    const fulfillment = await prisma.orderFulfillment.findUniqueOrThrow({
      where: { id: order.items[0]!.fulfillment!.id },
    });
    assert.equal(item.status, "refunded");
    assert.equal(fulfillment.status, "refunded");

    const freshPayment = await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
    assert.equal(freshPayment.status, "refunded");

    const refundTxn = await prisma.walletTransaction.findFirstOrThrow({
      where: { userId: user.id, type: "refund", referenceId: order.id },
      orderBy: { createdAt: "desc" },
    });
    assert.equal(refundTxn.amount, order.totalAmount);

    const log = await prisma.auditLog.findFirstOrThrow({
      where: {
        actorId: admin.id,
        action: AuditAction.ADMIN_REFUND_ORDER,
        targetId: order.id,
      },
      orderBy: { createdAt: "desc" },
    });
    assert.equal((log.metadata as any).reason, "Customer requested cancellation");
  } finally {
    await cleanupOrder(order.id, user.id);
    await prisma.user.delete({ where: { id: user.id } });
  }
});

test("refunding an already refunded order is rejected", async () => {
  const admin = await prisma.admin.findFirstOrThrow();
  const user = await prisma.user.create({
    data: { email: `refund-dup-${Date.now()}@test.com`, passwordHash: "x" },
  });
  const wallet = new WalletService(prisma as any);
  const audit = new AuditService(prisma as any);
  const service = new AdminRefundService(prisma as any, wallet, { enqueueEmail: async () => {} } as any, audit);
  const { order } = await makePaidOrder(user.id);

  try {
    await service.refundOrder(admin.id, order.id, { reason: "first refund" });
    await assert.rejects(
      () => service.refundOrder(admin.id, order.id, { reason: "second refund" }),
      /đã được hoàn tiền|refunded/i,
    );
  } finally {
    await cleanupOrder(order.id, user.id);
    await prisma.user.delete({ where: { id: user.id } });
  }
});
