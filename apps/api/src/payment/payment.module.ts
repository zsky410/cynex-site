import { Module } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { PayosService } from "./payos.service";
import { PaymentController } from "./payment.controller";
import { WebhookController } from "./webhook.controller";

@Module({
  controllers: [PaymentController, WebhookController],
  providers: [PaymentService, PayosService],
  exports: [PaymentService, PayosService],
})
export class PaymentModule {}
