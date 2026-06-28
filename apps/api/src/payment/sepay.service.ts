import {
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

export interface SepayPaymentPayload {
  paymentCode: string;
  amount: number;
  qrCode: string;
  bankName: string;
  bankAccount: string;
  accountHolder: string;
  transferContent: string;
}

export interface CreateSepayPayloadInput {
  paymentCode: string;
  amount: number;
}

export interface SepayWebhookEvent {
  paymentCode: string;
  amount: number;
  providerTransactionId?: string;
}

@Injectable()
export class SepayService {
  constructor(private readonly config: ConfigService) {}

  createPaymentPayload(input: CreateSepayPayloadInput): SepayPaymentPayload {
    const bankName = this.config.get<string>("SEPAY_BANK_NAME");
    const bankAccount = this.config.get<string>("SEPAY_BANK_ACCOUNT");
    const accountHolder = this.config.get<string>("SEPAY_ACCOUNT_HOLDER");
    const qrTemplate = this.config.get<string>("SEPAY_QR_TEMPLATE") ?? "compact";

    if (!bankName || !bankAccount || !accountHolder) {
      throw new InternalServerErrorException("SePay chưa được cấu hình đầy đủ");
    }

    const transferContent = input.paymentCode;
    const qrUrl = new URL("https://vietqr.app/img");
    qrUrl.searchParams.set("acc", bankAccount);
    qrUrl.searchParams.set("bank", bankName);
    qrUrl.searchParams.set("amount", String(input.amount));
    qrUrl.searchParams.set("des", transferContent);
    qrUrl.searchParams.set("template", qrTemplate);

    return {
      paymentCode: input.paymentCode,
      amount: input.amount,
      qrCode: qrUrl.toString(),
      bankName,
      bankAccount,
      accountHolder,
      transferContent,
    };
  }

  verifyWebhookSecret(received: string | undefined) {
    const expected = this.config.get<string>("SEPAY_WEBHOOK_SECRET");
    if (!expected || received !== expected) {
      throw new UnauthorizedException("Invalid SePay webhook secret");
    }
  }

  parseWebhook(body: Record<string, unknown>): SepayWebhookEvent {
    const transferContent =
      typeof body.transferContent === "string"
        ? body.transferContent.trim()
        : typeof body.content === "string"
          ? body.content.trim()
          : "";

    const amount =
      typeof body.amount === "number"
        ? body.amount
        : typeof body.amount === "string"
          ? Number(body.amount)
          : NaN;

    const providerTransactionId =
      typeof body.transactionId === "string"
        ? body.transactionId
        : typeof body.reference === "string"
          ? body.reference
          : undefined;

    if (!transferContent || !Number.isFinite(amount)) {
      throw new UnauthorizedException("Malformed SePay webhook payload");
    }

    return {
      paymentCode: transferContent,
      amount,
      providerTransactionId,
    };
  }
}
