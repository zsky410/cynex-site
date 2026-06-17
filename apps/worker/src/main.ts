import { Worker } from "bullmq";
import { QUEUE } from "@cynex/shared";
import { connection } from "./redis";
import { jobHandlers } from "./handlers";
// Side-effect imports: each phase registers its handlers on import.
import "./jobs/index";

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

connection.on("connect", () => console.log("[worker] connected to redis"));
console.log(`[worker] started, queues: ${Object.values(QUEUE).join(", ")}`);

async function shutdown(): Promise<void> {
  await Promise.all(workers.map((w) => w.close()));
  await connection.quit();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
