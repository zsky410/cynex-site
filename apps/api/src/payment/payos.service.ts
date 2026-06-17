import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import PayOS from "@payos/node";

export interface CreateLinkInput {
  payosOrderCode: number;
  amount: number;
  description: string;
  returnUrl: string;
  cancelUrl: string;
}

export interface CreatedLink {
  checkoutUrl: string;
  qrCode: string;
  paymentLinkId: string;
}

@Injectable()
export class PayosService {
  private readonly logger = new Logger(PayosService.name);
  private readonly client: PayOS | null;

  constructor(private readonly config: ConfigService) {
    const clientId = config.get<string>("PAYOS_CLIENT_ID");
    const apiKey = config.get<string>("PAYOS_API_KEY");
    const checksum = config.get<string>("PAYOS_CHECKSUM_KEY");
    this.client = clientId && apiKey && checksum ? new PayOS(clientId, apiKey, checksum) : null;
    if (!this.client) {
      this.logger.warn("payOS keys not configured — payment link creation will fail until set");
    }
  }

  get configured(): boolean {
    return this.client !== null;
  }

  async createLink(input: CreateLinkInput): Promise<CreatedLink> {
    if (!this.client) throw new Error("payOS is not configured");
    const res = await this.client.createPaymentLink({
      orderCode: input.payosOrderCode,
      amount: input.amount,
      description: input.description.slice(0, 25),
      returnUrl: input.returnUrl,
      cancelUrl: input.cancelUrl,
    });
    return {
      checkoutUrl: res.checkoutUrl,
      qrCode: res.qrCode,
      paymentLinkId: res.paymentLinkId,
    };
  }

  // Throws if the signature is invalid. Returns the verified webhook data.
  verifyWebhook(body: unknown): { orderCode: number; amount: number; reference?: string; [k: string]: unknown } {
    if (!this.client) throw new Error("payOS is not configured");
    return this.client.verifyPaymentWebhookData(body as any) as any;
  }
}
