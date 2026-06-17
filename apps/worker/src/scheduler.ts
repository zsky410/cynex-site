import { Queue } from "bullmq";
import { ALERT_JOB, QUEUE } from "@cynex/shared";
import { connection } from "./redis";

export async function registerAlertSchedulers() {
  const queue = new Queue(QUEUE.alerts, { connection });

  await queue.upsertJobScheduler(
    "notify-admin-pending-every-30m",
    { every: 30 * 60 * 1000 },
    {
      name: ALERT_JOB.notifyAdminPending,
      data: {},
    },
  );

  await queue.upsertJobScheduler(
    "daily-stock-alert-8am",
    { pattern: "0 8 * * *" },
    {
      name: ALERT_JOB.dailyStockAlert,
      data: { lowStockThreshold: 3 },
    },
  );

  return queue;
}
