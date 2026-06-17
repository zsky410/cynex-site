import { after, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@cynex/db";
import { ALERT_JOB } from "@cynex/shared";
import { jobHandlers } from "../../worker/src/handlers";
import "../../worker/src/jobs/notify-admin-pending";
import "../../worker/src/jobs/daily-stock-alert";

const prisma = new PrismaClient();

after(async () => {
  await prisma.$disconnect();
});

test("alert job handlers are registered and can run without throwing", async () => {
  const pendingHandler = jobHandlers[ALERT_JOB.notifyAdminPending];
  const stockHandler = jobHandlers[ALERT_JOB.dailyStockAlert];

  assert.ok(pendingHandler, "pending-order alert handler must be registered");
  assert.ok(stockHandler, "daily-stock alert handler must be registered");

  await pendingHandler({ id: "pending-alert-job", name: ALERT_JOB.notifyAdminPending, data: {} } as any);
  await stockHandler({
    id: "stock-alert-job",
    name: ALERT_JOB.dailyStockAlert,
    data: { lowStockThreshold: 2 },
  } as any);
});
