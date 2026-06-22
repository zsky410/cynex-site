import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import type { CorsOptions } from "@nestjs/common/interfaces/external/cors-options.interface";
import { AppModule } from "./app.module";
import { captureApiException, initApiSentry } from "./sentry";

function collectAllowedOrigins(): string[] {
  const configured = [process.env.WEB_BASE_URL, process.env.ADMIN_BASE_URL].filter(
    (value): value is string => Boolean(value),
  );
  const devOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://[::1]:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://[::1]:5173",
  ];
  return [...new Set([...configured, ...devOrigins])];
}

async function bootstrap(): Promise<void> {
  initApiSentry(process.env.SENTRY_DSN);
  process.on("uncaughtException", captureApiException);
  process.on("unhandledRejection", captureApiException);
  const app = await NestFactory.create(AppModule, { bodyParser: true });
  app.setGlobalPrefix("", { exclude: ["health"] });
  const allowedOrigins = collectAllowedOrigins();
  app.enableCors({
    origin: ((
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} is not allowed by CORS`), false);
    }) satisfies NonNullable<CorsOptions["origin"]>,
    credentials: true,
  });
  const port = Number(process.env.API_PORT ?? 3001);
  await app.listen(port);
  Logger.log(`API listening on http://localhost:${port}`, "Bootstrap");
  Logger.log(`CORS origins: ${allowedOrigins.join(", ")}`, "Bootstrap");
}

void bootstrap();
