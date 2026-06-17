import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";

// Worker runs as a standalone process; load the monorepo root .env (cwd is
// apps/worker in dev). Real env vars take precedence in Docker.
loadDotenv({ path: resolve(process.cwd(), "../../.env") });
loadDotenv();

export const config = {
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "Cynex <noreply@cynex.local>",
  webBaseUrl: process.env.WEB_BASE_URL ?? "http://localhost:3000",
  sentryDsn: process.env.SENTRY_DSN ?? "",
};
