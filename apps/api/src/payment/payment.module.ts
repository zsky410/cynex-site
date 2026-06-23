import { Module } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { PayosService } from "./payos.service";
import { PaymentController } from "./payment.controller";
import { WebhookController } from "./webhook.controller";
import { SepayService } from "./sepay.service";

@Module({
  controllers: [PaymentController, WebhookController],
  providers: [PaymentService, PayosService, SepayService],
  exports: [PaymentService, PayosService, SepayService],
})
export class PaymentModule {}
