import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { validateEnv } from "./config/env";
import { PrismaModule } from "./prisma/prisma.module";
import { HealthController } from "./health.controller";
import { QueueModule } from "./queue/queue.module";
import { AuthModule } from "./auth/auth.module";
import { CatalogModule } from "./catalog/catalog.module";
import { OrdersModule } from "./orders/orders.module";
import { WalletModule } from "./wallet/wallet.module";
import { PaymentModule } from "./payment/payment.module";
import { AdminModule } from "./admin/admin.module";

// Feature modules are registered here as each phase lands.
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // dev runs with cwd = apps/api, so the root .env is two levels up; in
      // Docker the vars are injected and the missing file is ignored.
      envFilePath: ["../../.env", ".env"],
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    QueueModule,
    WalletModule,
    AuthModule,
    CatalogModule,
    OrdersModule,
    PaymentModule,
    AdminModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
