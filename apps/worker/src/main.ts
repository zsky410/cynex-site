import { Worker } from "bullmq";
import { QUEUE } from "@cynex/shared";
import { connection } from "./redis";
import { jobHandlers } from "./handlers";
import { registerAlertSchedulers } from "./scheduler";
import { captureWorkerException, initWorkerSentry } from "./sentry";
// Side-effect imports: each phase registers its handlers on import.
import "./jobs/index";

initWorkerSentry(process.env.SENTRY_DSN);
process.on("uncaughtException", captureWorkerException);
process.on("unhandledRejection", captureWorkerException);

function startWorker(queueName: string): Worker {
  const worker = new Worker(
    queueName,
    async (job) => {
      const handler = jobHandlers[job.name];
      if (!handler) {
        console.warn(`[worker] no handler for job "${job.name}" on queue "${queueName}"`);
        return;
      }
      await handler(job);
    },
    { connection, concurrency: 5 },
  );
  worker.on("failed", (job, err) => {
    console.error(`[worker] job ${job?.name} (${job?.id}) failed:`, err.message);
  });
  return worker;
}

const workers = [startWorker(QUEUE.email), startWorker(QUEUE.alerts)];
const schedulerQueuePromise = registerAlertSchedulers()
  .then((queue) => {
    console.log("[worker] alert schedulers registered");
    return queue;
  })
  .catch((error) => {
    console.error("[worker] failed to register alert schedulers:", error.message);
    throw error;
  });

connection.on("connect", () => console.log("[worker] connected to redis"));
console.log(`[worker] started, queues: ${Object.values(QUEUE).join(", ")}`);

async function shutdown(): Promise<void> {
  const schedulerQueue = await schedulerQueuePromise.catch(() => null);
  if (schedulerQueue) {
    await schedulerQueue.close();
  }
  await Promise.all(workers.map((w) => w.close()));
  await connection.quit();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
