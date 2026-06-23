import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PaymentProvider as PrismaPaymentProvider } from "@cynex/db";
import { ConfigService } from "@nestjs/config";
import { PaymentMethod, PaymentProvider } from "@cynex/shared";
import { SepayService } from "../src/payment/sepay.service";

test("shared enums expose sepay provider", () => {
  assert.equal(PaymentProvider.sepay, "sepay");
  assert.equal(PaymentMethod.sepay, "sepay");
  assert.deepEqual(PaymentProvider, PrismaPaymentProvider);
  assert.equal(PaymentMethod.sepay, PrismaPaymentProvider.sepay);

  const migrationSql = readFileSync(
    resolve(import.meta.dirname, "../../../packages/db/prisma/migrations/20260617091437_init/migration.sql"),
    "utf8",
  );

  assert.match(
    migrationSql,
    /CREATE TYPE "PaymentProvider" AS ENUM \('payos', 'sepay', 'wallet', 'manual'\);/,
  );
});

test("sepay service builds bank transfer payload from payment code", () => {
  const config = new ConfigService({
    SEPAY_BANK_NAME: "MBBank",
    SEPAY_BANK_ACCOUNT: "0123456789",
    SEPAY_ACCOUNT_HOLDER: "CYNEX COMPANY",
    SEPAY_QR_TEMPLATE: "compact",
    SEPAY_WEBHOOK_SECRET: "secret",
  });

  const service = new SepayService(config);
  const payload = service.createPaymentPayload({
    amount: 150000,
    paymentCode: "SEP123456",
  });

  assert.equal(payload.bankName, "MBBank");
  assert.equal(payload.bankAccount, "0123456789");
  assert.equal(payload.accountHolder, "CYNEX COMPANY");
  assert.equal(payload.amount, 150000);
  assert.equal(payload.transferContent, "SEP123456");
  assert.match(payload.qrCode, /SEP123456/);
});
