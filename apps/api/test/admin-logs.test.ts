import { after, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@cynex/db";
import { AuditAction } from "@cynex/shared";
import { AdminEmailLogsController } from "../src/admin/logs/admin-email-logs.controller";
import { AdminAuditLogsController } from "../src/admin/logs/admin-audit-logs.controller";

const prisma = new PrismaClient();
const emailLogs = new AdminEmailLogsController(prisma as any);
const auditLogs = new AdminAuditLogsController(prisma as any);

after(async () => {
  await prisma.$disconnect();
});

test("admin email-log viewer lists by type and returns detail with user/order context", async () => {
  const user = await prisma.user.create({
    data: { email: `elog-${Date.now()}@test.com`, passwordHash: "x" },
  });
  const order = await prisma.order.create({
    data: {
      orderCode: `ELOG${Date.now()}${Math.floor(Math.random() * 1e4)}`,
      userId: user.id,
      totalAmount: 25000,
      paymentStatus: "paid",
      fulfillmentStatus: "paid_waiting_admin",
    },
  });
  const email = await prisma.emailLog.create({
    data: {
      userId: user.id,
      orderId: order.id,
      type: "refund",
      toEmail: user.email,
      subject: "Refund sent",
      bodySnapshot: "<p>Refund sent</p>",
      status: "sent",
      dedupeKey: `elog:${order.id}:${Date.now()}`,
      sentByAdminId: (await prisma.admin.findFirstOrThrow()).id,
      sentAt: new Date(),
    },
  });

  try {
    const list = await emailLogs.list({
      page: "1",
      perPage: "25",
      filter: JSON.stringify({ type: "refund" }),
    });
    assert.equal(list.total >= 1, true);
    assert.equal(list.data.some((row: any) => row.id === email.id), true);

    const detail = await emailLogs.getOne(email.id);
    assert.equal(detail.data.id, email.id);
    assert.equal(detail.data.user?.email, user.email);
    assert.equal(detail.data.order?.orderCode, order.orderCode);
    assert.equal(detail.data.subject, "Refund sent");
  } finally {
    await prisma.emailLog.delete({ where: { id: email.id } });
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
});

test("admin audit-log viewer lists by action and returns detail", async () => {
  const admin = await prisma.admin.findFirstOrThrow();
  const log = await prisma.auditLog.create({
    data: {
      actorType: "admin",
      actorId: admin.id,
      action: AuditAction.ADMIN_REFUND_ORDER,
      targetType: "order",
      targetId: `order-${Date.now()}`,
      metadata: { reason: "customer request" },
    },
  });

  try {
    const list = await auditLogs.list({
      page: "1",
      perPage: "25",
      filter: JSON.stringify({ action: AuditAction.ADMIN_REFUND_ORDER }),
    });
    assert.equal(list.total >= 1, true);
    assert.equal(list.data.some((row: any) => row.id === log.id), true);

    const detail = await auditLogs.getOne(log.id);
    assert.equal(detail.data.id, log.id);
    assert.equal(detail.data.action, AuditAction.ADMIN_REFUND_ORDER);
    assert.equal((detail.data.metadata as any).reason, "customer request");
  } finally {
    await prisma.auditLog.delete({ where: { id: log.id } });
  }
});

test("admin email-log delete route hard-deletes a log", async () => {
  const user = await prisma.user.create({
    data: { email: `elog-delete-${Date.now()}@test.com`, passwordHash: "x" },
  });
  const email = await prisma.emailLog.create({
    data: {
      userId: user.id,
      type: "refund",
      toEmail: user.email,
      subject: "Delete me",
      bodySnapshot: "<p>Delete me</p>",
      status: "sent",
      dedupeKey: `elog-delete:${user.id}:${Date.now()}`,
      sentByAdminId: (await prisma.admin.findFirstOrThrow()).id,
      sentAt: new Date(),
    },
  });

  try {
    const result = await emailLogs.remove(email.id);
    assert.equal(result.data.id, email.id);

    const deleted = await prisma.emailLog.findUnique({ where: { id: email.id } });
    assert.equal(deleted, null);
  } finally {
    await prisma.emailLog.delete({ where: { id: email.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: user.id } });
  }
});
