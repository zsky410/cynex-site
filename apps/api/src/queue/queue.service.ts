import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import { QUEUE, EMAIL_JOB, ALERT_JOB } from "@cynex/shared";
import type { EmailJobName, AlertJobName } from "@cynex/shared";

// Thin producer wrapper. BullMQ builds its own ioredis from these options so we
// avoid sharing a connection instance across the version boundary.
@Injectable()
export class QueueService implements OnModuleDestroy {
  private readonly email: Queue;
  private readonly alerts: Queue;

  constructor(config: ConfigService) {
    const url = new URL(config.getOrThrow<string>("REDIS_URL"));
    const connection = {
      host: url.hostname,
      port: Number(url.port || 6379),
      password: url.password || undefined,
      maxRetriesPerRequest: null,
    };
    this.email = new Queue(QUEUE.email, { connection });
    this.alerts = new Queue(QUEUE.alerts, { connection });
  }

  // ponytail: BullMQ rejects ":" in custom job ids — sanitize centrally so callers keep readable dedupe keys.
  private bullJobId(jobId?: string): string | undefined {
    return jobId?.replace(/:/g, "-");
  }

  // jobId lets callers enforce idempotency (BullMQ dedupes by jobId).
  async enqueueEmail(name: EmailJobName, data: unknown, jobId?: string): Promise<void> {
    await this.email.add(name, data, {
      jobId: this.bullJobId(jobId),
      attempts: 5,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: 1000,
      removeOnFail: 5000,
    });
  }

  async enqueueAlert(name: AlertJobName, data: unknown, jobId?: string): Promise<void> {
    await this.alerts.add(name, data, {
      jobId: this.bullJobId(jobId),
      removeOnComplete: 100,
      removeOnFail: 100,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.email.close();
    await this.alerts.close();
  }
}

export { EMAIL_JOB, ALERT_JOB };
