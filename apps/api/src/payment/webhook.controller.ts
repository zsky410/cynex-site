import { Body, Controller, HttpCode, Logger, Post } from "@nestjs/common";
import { PayosService } from "./payos.service";
import { PaymentService } from "./payment.service";

@Controller("webhooks")
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly payos: PayosService,
    private readonly payment: PaymentService,
  ) {}

  @HttpCode(200)
  @Post("payos")
  async payosWebhook(@Body() body: any) {
    let data;
    try {
      // Throws on invalid signature -> we never mutate state for bad webhooks.
      data = this.payos.verifyWebhook(body);
    } catch (e) {
      this.logger.warn(`Rejected payOS webhook: ${(e as Error).message}`);
      return { success: false };
    }
    // payOS sends a verification ping (orderCode 123) when registering the URL.
    const paymentCode = String(data.orderCode);
    const txnId =
      (data.reference as string | undefined) ??
      (data.transactionDateTime as string | undefined) ??
      undefined;
    const result = await this.payment.markPaid(paymentCode, txnId, body);
    return { success: true, ...result };
  }
}
