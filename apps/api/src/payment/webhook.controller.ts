import { Body, Controller, Headers, HttpCode, Logger, Post } from "@nestjs/common";
import { SepayService } from "./sepay.service";
import { PaymentService } from "./payment.service";

@Controller("webhooks")
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly sepay: SepayService,
    private readonly payment: PaymentService,
  ) {}

  @HttpCode(200)
  @Post("sepay")
  async sepayWebhook(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: Record<string, unknown>,
  ) {
    try {
      const secretHeader = Array.isArray(headers["x-sepay-secret"])
        ? headers["x-sepay-secret"][0]
        : headers["x-sepay-secret"];
      this.sepay.verifyWebhookSecret(secretHeader);
      const event = this.sepay.parseWebhook(body);
      const payment = await this.payment.findPendingPayment(event.paymentCode);
      if (!payment || payment.amount !== event.amount) {
        this.logger.warn(`Rejected SePay webhook for ${event.paymentCode}`);
        return { success: false };
      }
      const result = await this.payment.markPaid(
        event.paymentCode,
        event.providerTransactionId,
        body,
      );
      return { success: true, ...result };
    } catch (e) {
      this.logger.warn(`Rejected SePay webhook: ${(e as Error).message}`);
      return { success: false };
    }
  }
}
