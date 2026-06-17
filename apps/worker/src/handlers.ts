import type { Job } from "bullmq";

// Job-name -> handler. Phases register their handlers here. Unknown jobs are
// logged (not thrown) so a deploy mismatch never kills the queue.
export type JobHandler = (job: Job) => Promise<void>;

export const jobHandlers: Record<string, JobHandler> = {
  noop: async (job) => {
    console.log(`[worker] noop job ${job.id} processed`, job.data);
  },
};

export function registerHandler(name: string, handler: JobHandler): void {
  jobHandlers[name] = handler;
}
