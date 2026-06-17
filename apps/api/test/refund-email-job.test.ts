import { after, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@cynex/db";
import { EMAIL_JOB, EmailType } from "@cynex/shared";
import { jobHandlers } from "../../worker/src/handlers";
import "../../worker/src/jobs/send-refund";

const prisma = new PrismaClient();

after(async () => {
  await prisma.$disconnect();
});

test("refund email job writes a sent email_log row", async () => {
  const user = await prisma.user.create({
    data: { email: `refund-email-${Date.now()}@test.com`, passwordHash: "x" },
  });
  const order = await prisma.order.create({
    data: {
      orderCode: `RFE${Date.now()}${Math.floor(Math.random() * 1e4)}`,
      userId: user.id,
      totalAmount: 12345,
      paymentStatus: "refunded",
      fulfillmentStatus: "refunded",
    },
  });

  try {
    const handler = jobHandlers[EMAIL_JOB.refund];
    assert.ok(handler, "refund handler must be registered");

    await handler({
      id: `job-${Date.now()}`,
      name: EMAIL_JOB.refund,
      data: {
        toEmail: user.email,
        userId: user.id,
        orderId: order.id,
        orderCode: order.orderCode,
        amount: order.totalAmount,
        reason: "Customer requested cancellation",
        balanceAfter: 55555,
      },
    } as any);

    const emailLog = await prisma.emailLog.findFirstOrThrow({
      where: { orderId: order.id, type: EmailType.refund },
      orderBy: { createdAt: "desc" },
    });
    assert.equal(emailLog.status, "sent");
    assert.equal(emailLog.toEmail, user.email);
    assert.match(emailLog.subject, /Hoàn tiền/);
  } finally {
    await prisma.emailLog.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
});
