import { Module } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { PaymentController } from "./payment.controller";
import { WebhookController } from "./webhook.controller";
import { SepayService } from "./sepay.service";

@Module({
  controllers: [PaymentController, WebhookController],
  providers: [PaymentService, SepayService],
  exports: [PaymentService],
})
export class PaymentModule {}
