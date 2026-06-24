import { z } from "zod";

// Validated at boot via ConfigModule.validate. A missing required var throws and
// the process exits non-zero (PRD acceptance T0.11).
export const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  API_PORT: z.coerce.number().default(3001),
  WEB_BASE_URL: z.string().url().default("http://localhost:3000"),
  ADMIN_BASE_URL: z.string().url().default("http://localhost:5173"),

  JWT_ACCESS_SECRET: z.string().min(8),
  JWT_REFRESH_SECRET: z.string().min(8),
  JWT_ACCESS_TTL: z.coerce.number().default(900),
  JWT_REFRESH_TTL: z.coerce.number().default(1209600),

  ENCRYPTION_KEY: z.string().min(1),

  SEPAY_BANK_NAME: z.string().default(""),
  SEPAY_BANK_ACCOUNT: z.string().default(""),
  SEPAY_ACCOUNT_HOLDER: z.string().default(""),
  SEPAY_QR_TEMPLATE: z.string().default("compact"),
  SEPAY_WEBHOOK_SECRET: z.string().default(""),

  RESEND_API_KEY: z.string().default(""),
  EMAIL_FROM: z.string().default("Cynex <noreply@cynex.local>"),

  R2_ACCOUNT_ID: z.string().default(""),
  R2_ACCESS_KEY_ID: z.string().default(""),
  R2_SECRET_ACCESS_KEY: z.string().default(""),
  R2_BUCKET: z.string().default("cynex"),
  R2_PUBLIC_BASE_URL: z.string().default(""),
  R2_ENDPOINT: z.string().default(""),

  SENTRY_DSN: z.string().default(""),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  return parsed.data;
}
