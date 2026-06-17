import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { AppModule } from "./app.module";
import { captureApiException, initApiSentry } from "./sentry";

async function bootstrap(): Promise<void> {
  initApiSentry(process.env.SENTRY_DSN);
  process.on("uncaughtException", captureApiException);
  process.on("unhandledRejection", captureApiException);
  const app = await NestFactory.create(AppModule, { bodyParser: true });
  app.setGlobalPrefix("", { exclude: ["health"] });
  app.enableCors({
    origin: [process.env.WEB_BASE_URL ?? "*", process.env.ADMIN_BASE_URL ?? "*"],
    credentials: true,
  });
  const port = Number(process.env.API_PORT ?? 3001);
  await app.listen(port);
  Logger.log(`API listening on http://localhost:${port}`, "Bootstrap");
}

void bootstrap();
