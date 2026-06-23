import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PaymentProvider as PrismaPaymentProvider } from "@cynex/db";
import { ConfigService } from "@nestjs/config";
import { PaymentMethod, PaymentProvider } from "@cynex/shared";
import { SepayService } from "../src/payment/sepay.service";
import { PrismaClient } from "@cynex/db";
import { PaymentService } from "../src/payment/payment.service";
import { WalletService } from "../src/wallet/wallet.service";

function createPaymentService(prisma: PrismaClient, config: ConfigService) {
  const wallet = new WalletService(prisma as any);
  const sepay = new SepayService(config);
  const payos = {
    createLink: async ({ payosOrderCode }: { payosOrderCode: number }) => ({
      checkoutUrl: `https://payos.test/${payosOrderCode}`,
      qrCode: `payos-qr-${payosOrderCode}`,
      paymentLinkId: `payos-link-${payosOrderCode}`,
    }),
  };

  if (PaymentService.length >= 6) {
    return new (PaymentService as any)(prisma, payos, sepay, {} as any, config, wallet);
  }

  return new (PaymentService as any)(prisma, payos, {} as any, config, wallet);
}

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

test("sepay service throws when bank config is incomplete", () => {
  const config = new ConfigService({
    SEPAY_BANK_NAME: "MBBank",
    SEPAY_ACCOUNT_HOLDER: "CYNEX COMPANY",
  });

  const service = new SepayService(config);

  assert.throws(
    () =>
      service.createPaymentPayload({
        amount: 150000,
        paymentCode: "SEP123456",
      }),
    /SePay chưa được cấu hình đầy đủ/,
  );
});

test("sepay service validates webhook secret", () => {
  const config = new ConfigService({
    SEPAY_WEBHOOK_SECRET: "secret",
  });
  const service = new SepayService(config);

  assert.doesNotThrow(() => service.verifyWebhookSecret("secret"));
  assert.throws(() => service.verifyWebhookSecret("wrong"), /Invalid SePay webhook secret/);
});

test("sepay service parses webhook payload variants", () => {
  const service = new SepayService(new ConfigService());

  assert.deepEqual(
    service.parseWebhook({
      transferContent: " SEP123456 ",
      amount: "150000",
      transactionId: "txn-1",
    }),
    {
      paymentCode: "SEP123456",
      amount: 150000,
      providerTransactionId: "txn-1",
    },
  );

  assert.deepEqual(
    service.parseWebhook({
      content: "SEP654321",
      amount: 275000,
      reference: "ref-2",
    }),
    {
      paymentCode: "SEP654321",
      amount: 275000,
      providerTransactionId: "ref-2",
    },
  );
});

test("payment module keeps both payos and sepay services wired", () => {
  const moduleSource = readFileSync(
    resolve(import.meta.dirname, "../src/payment/payment.module.ts"),
    "utf8",
  );

  assert.match(moduleSource, /import\s+\{\s*PayosService\s*\}\s+from\s+"\.\/payos\.service";/);
  assert.match(moduleSource, /import\s+\{\s*SepayService\s*\}\s+from\s+"\.\/sepay\.service";/);
  assert.match(moduleSource, /providers:\s*\[PaymentService,\s*PayosService,\s*SepayService\]/);
  assert.match(moduleSource, /exports:\s*\[PaymentService,\s*PayosService,\s*SepayService\]/);
});

test("api package keeps payos dependency until sepay cutover", () => {
  const packageJson = JSON.parse(
    readFileSync(resolve(import.meta.dirname, "../package.json"), "utf8"),
  ) as { dependencies?: Record<string, string> };

  assert.equal(packageJson.dependencies?.["@payos/node"], "^1.0.8");
});

test("createOrderPayment creates a new sepay payment for each attempt", async () => {
  const prisma = new PrismaClient();
  const config = new ConfigService({
    SEPAY_BANK_NAME: "MBBank",
    SEPAY_BANK_ACCOUNT: "0123456789",
    SEPAY_ACCOUNT_HOLDER: "CYNEX COMPANY",
    SEPAY_QR_TEMPLATE: "compact",
  });
  const service = createPaymentService(prisma, config);

  const user = await prisma.user.create({
    data: { email: `sepay-order-${Date.now()}@test.com`, passwordHash: "x" },
  });
  const variant = await prisma.productVariant.findFirstOrThrow();
  const order = await prisma.order.create({
    data: {
      orderCode: `SEPAY-ORDER-${Date.now()}`,
      userId: user.id,
      totalAmount: 42000,
      items: {
        create: {
          productId: variant.productId,
          productVariantId: variant.id,
          quantity: 1,
          unitPrice: 42000,
          totalPrice: 42000,
          fulfillmentType: variant.fulfillmentType,
          fulfillment: { create: { fulfillmentType: variant.fulfillmentType } },
        },
      },
    },
  });

  try {
    const first = await service.createOrderPayment(user.id, order.orderCode);
    const second = await service.createOrderPayment(user.id, order.orderCode);

    assert.equal(first.bankName, "MBBank");
    assert.equal(first.bankAccount, "0123456789");
    assert.equal(first.accountHolder, "CYNEX COMPANY");
    assert.equal(first.amount, 42000);
    assert.equal(first.transferContent, first.paymentCode);
    assert.match(first.qrCode, new RegExp(first.paymentCode));

    assert.equal(second.bankName, "MBBank");
    assert.notEqual(second.paymentCode, first.paymentCode);
    assert.equal(second.transferContent, second.paymentCode);

    const payments = await prisma.payment.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: "asc" },
    });

    assert.equal(payments.length, 2);
    assert.deepEqual(
      payments.map((payment) => payment.provider),
      ["sepay", "sepay"],
    );
    assert.deepEqual(
      payments.map((payment) => payment.status),
      ["pending", "pending"],
    );
    assert.notEqual(payments[0]?.paymentCode, payments[1]?.paymentCode);
    assert.equal(payments[0]?.paymentCode, first.paymentCode);
    assert.equal(payments[1]?.paymentCode, second.paymentCode);
  } finally {
    await prisma.payment.deleteMany({ where: { orderId: order.id } });
    await prisma.orderFulfillment.deleteMany({ where: { orderItem: { orderId: order.id } } });
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
});

test("createDeposit creates a new sepay deposit payment for each attempt", async () => {
  const prisma = new PrismaClient();
  const config = new ConfigService({
    SEPAY_BANK_NAME: "MBBank",
    SEPAY_BANK_ACCOUNT: "0123456789",
    SEPAY_ACCOUNT_HOLDER: "CYNEX COMPANY",
    SEPAY_QR_TEMPLATE: "compact",
  });
  const service = createPaymentService(prisma, config);

  const user = await prisma.user.create({
    data: { email: `sepay-deposit-${Date.now()}@test.com`, passwordHash: "x" },
  });

  try {
    const first = await service.createDeposit(user.id, 150000);
    const second = await service.createDeposit(user.id, 150000);

    assert.equal(first.bankName, "MBBank");
    assert.equal(first.bankAccount, "0123456789");
    assert.equal(first.accountHolder, "CYNEX COMPANY");
    assert.equal(first.amount, 150000);
    assert.equal(first.transferContent, first.paymentCode);
    assert.match(first.qrCode, new RegExp(first.paymentCode));

    assert.equal(second.bankName, "MBBank");
    assert.notEqual(second.paymentCode, first.paymentCode);
    assert.equal(second.transferContent, second.paymentCode);

    const payments = await prisma.payment.findMany({
      where: { userId: user.id, isDeposit: true },
      orderBy: { createdAt: "asc" },
    });

    assert.equal(payments.length, 2);
    assert.deepEqual(
      payments.map((payment) => payment.provider),
      ["sepay", "sepay"],
    );
    assert.deepEqual(
      payments.map((payment) => payment.status),
      ["pending", "pending"],
    );
    assert.equal(payments[0]?.amount, 150000);
    assert.equal(payments[1]?.amount, 150000);
    assert.notEqual(payments[0]?.paymentCode, payments[1]?.paymentCode);
    assert.equal(payments[0]?.paymentCode, first.paymentCode);
    assert.equal(payments[1]?.paymentCode, second.paymentCode);
  } finally {
    await prisma.payment.deleteMany({ where: { userId: user.id, isDeposit: true } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
});
