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
import { WebhookController } from "../src/payment/webhook.controller";

function createIsolatedConfig(values: Record<string, string>) {
  const config = new ConfigService(values);
  (config as any).skipProcessEnv = true;
  return config;
}

function createPaymentService(prisma: PrismaClient, config: ConfigService) {
  const wallet = new WalletService(prisma as any);
  const sepayCalls: Array<{ paymentCode: string; amount: number }> = [];
  const sepay = {
    createPaymentPayload: ({ paymentCode, amount }: { paymentCode: string; amount: number }) => {
      sepayCalls.push({ paymentCode, amount });
      return {
        paymentCode,
        amount,
        qrCode: `sepay-qr-${paymentCode}`,
        bankName: "MBBank",
        bankAccount: "0123456789",
        accountHolder: "CYNEX COMPANY",
        transferContent: paymentCode,
      };
    },
  };
  const service = new PaymentService(
    prisma as any,
    sepay as any,
    {} as any,
    config,
    wallet,
  );

  return { service, sepayCalls };
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
  const config = createIsolatedConfig({
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
  const qrUrl = new URL(payload.qrCode);
  assert.equal(qrUrl.origin, "https://vietqr.app");
  assert.equal(qrUrl.pathname, "/img");
  assert.equal(qrUrl.searchParams.get("acc"), "0123456789");
  assert.equal(qrUrl.searchParams.get("bank"), "MBBank");
  assert.equal(qrUrl.searchParams.get("amount"), "150000");
  assert.equal(qrUrl.searchParams.get("des"), "SEP123456");
  assert.equal(qrUrl.searchParams.get("template"), "compact");
});

test("sepay service throws when bank config is incomplete", () => {
  const config = createIsolatedConfig({
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
  const config = createIsolatedConfig({
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

test("payment module wires only sepay service", () => {
  const moduleSource = readFileSync(
    resolve(import.meta.dirname, "../src/payment/payment.module.ts"),
    "utf8",
  );

  assert.match(moduleSource, /import\s+\{\s*SepayService\s*\}\s+from\s+"\.\/sepay\.service";/);
  assert.doesNotMatch(moduleSource, /PayosService/);
  assert.match(moduleSource, /providers:\s*\[PaymentService,\s*SepayService\]/);
  assert.match(moduleSource, /exports:\s*\[PaymentService,\s*SepayService\]/);
});

test("api package no longer depends on payos after sepay cutover", () => {
  const packageJson = JSON.parse(
    readFileSync(resolve(import.meta.dirname, "../package.json"), "utf8"),
  ) as { dependencies?: Record<string, string> };

  assert.equal(packageJson.dependencies?.["@payos/node"], undefined);
});

test("createOrderPayment creates a new sepay payment for each attempt", async () => {
  const prisma = new PrismaClient();
  const config = new ConfigService({
    SEPAY_BANK_NAME: "MBBank",
    SEPAY_BANK_ACCOUNT: "0123456789",
    SEPAY_ACCOUNT_HOLDER: "CYNEX COMPANY",
    SEPAY_QR_TEMPLATE: "compact",
  });
  const { service, sepayCalls } = createPaymentService(prisma, config);

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
    assert.ok(first.expiredAt);
    assert.ok(new Date(first.expiredAt).getTime() > Date.now() + 9 * 60 * 1000);
    assert.ok(new Date(first.expiredAt).getTime() <= Date.now() + 10 * 60 * 1000 + 5_000);
    assert.match(first.qrCode, new RegExp(first.paymentCode));

    assert.equal(second.bankName, "MBBank");
    assert.notEqual(second.paymentCode, first.paymentCode);
    assert.equal(second.transferContent, second.paymentCode);
    assert.deepEqual(sepayCalls.map((call) => call.amount), [42000, 42000]);
    assert.deepEqual(sepayCalls.map((call) => call.paymentCode), [first.paymentCode, second.paymentCode]);

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
      ["cancelled", "pending"],
    );
    assert.notEqual(payments[0]?.paymentCode, payments[1]?.paymentCode);
    assert.equal(payments[0]?.paymentCode, first.paymentCode);
    assert.equal(payments[1]?.paymentCode, second.paymentCode);
    assert.ok(payments[1]?.expiredAt);
  } finally {
    await prisma.payment.deleteMany({ where: { orderId: order.id } });
    await prisma.orderFulfillment.deleteMany({ where: { orderItem: { orderId: order.id } } });
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
});

test("expired sepay payment is cancelled and does not settle order", async () => {
  const prisma = new PrismaClient();
  const wallet = new WalletService(prisma as any);
  let emailCalls = 0;
  const queueStub = {
    enqueueEmail: async () => {
      emailCalls += 1;
    },
  };
  const config = new ConfigService({
    SEPAY_BANK_NAME: "MBBank",
    SEPAY_BANK_ACCOUNT: "0123456789",
    SEPAY_ACCOUNT_HOLDER: "CYNEX COMPANY",
    SEPAY_WEBHOOK_SECRET: "secret",
  });
  const paymentService = new PaymentService(
    prisma as any,
    new SepayService(config) as any,
    queueStub as any,
    config as any,
    wallet,
  );

  const user = await prisma.user.create({
    data: { email: `expired-payment-${Date.now()}@test.com`, passwordHash: "x" },
  });
  const variant = await prisma.productVariant.findFirstOrThrow();
  const order = await prisma.order.create({
    data: {
      orderCode: `EXP-${Date.now()}`,
      userId: user.id,
      totalAmount: 99000,
      items: {
        create: {
          productId: variant.productId,
          productVariantId: variant.id,
          quantity: 1,
          unitPrice: 99000,
          totalPrice: 99000,
          fulfillmentType: variant.fulfillmentType,
          fulfillment: { create: { fulfillmentType: variant.fulfillmentType } },
        },
      },
    },
  });
  const payment = await prisma.payment.create({
    data: {
      paymentCode: `SEPEXP${Date.now()}`,
      orderId: order.id,
      userId: user.id,
      amount: 99000,
      provider: "sepay",
      status: "pending",
      expiredAt: new Date(Date.now() - 1000),
    },
  });

  try {
    assert.equal(await paymentService.findPendingPayment(payment.paymentCode), null);
    const result = await paymentService.markPaid(payment.paymentCode, "txn-expired", { expired: true });

    assert.deepEqual(result, { handled: true, duplicate: true });
    assert.equal(emailCalls, 0);

    const freshPayment = await prisma.payment.findUniqueOrThrow({ where: { id: payment.id } });
    assert.equal(freshPayment.status, "cancelled");
    assert.equal(freshPayment.paidAt, null);

    const freshOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(freshOrder.paymentStatus, "pending");
    assert.equal(freshOrder.fulfillmentStatus, "waiting_payment");
  } finally {
    await prisma.payment.deleteMany({ where: { orderId: order.id } });
    await prisma.orderFulfillment.deleteMany({ where: { orderItem: { orderId: order.id } } });
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
});

test("sepay webhook rejects invalid secret", async () => {
  const controller = new WebhookController(
    new SepayService(
      new ConfigService({
        SEPAY_BANK_NAME: "MBBank",
        SEPAY_BANK_ACCOUNT: "0123456789",
        SEPAY_ACCOUNT_HOLDER: "CYNEX COMPANY",
        SEPAY_WEBHOOK_SECRET: "secret",
      }),
    ),
    {
      findPendingPayment: async () => ({ id: "p1", amount: 1000 }),
      markPaid: async () => ({ handled: true }),
    } as any,
  );

  const result = await controller.sepayWebhook(
    { "x-sepay-secret": "wrong" } as any,
    { transferContent: "SEP123", amount: 1000 },
  );

  assert.deepEqual(result, { success: false });
});

test("sepay webhook rejects amount mismatch", async () => {
  let markPaidCalls = 0;
  const controller = new WebhookController(
    new SepayService(
      new ConfigService({
        SEPAY_BANK_NAME: "MBBank",
        SEPAY_BANK_ACCOUNT: "0123456789",
        SEPAY_ACCOUNT_HOLDER: "CYNEX COMPANY",
        SEPAY_WEBHOOK_SECRET: "secret",
      }),
    ),
    {
      findPendingPayment: async () => ({ id: "p1", amount: 1000 }),
      markPaid: async () => {
        markPaidCalls += 1;
        return { handled: true };
      },
    } as any,
  );

  const result = await controller.sepayWebhook(
    { "x-sepay-secret": "secret" } as any,
    { transferContent: "SEP123", amount: 999, transactionId: "txn-1" },
  );

  assert.deepEqual(result, { success: false });
  assert.equal(markPaidCalls, 0);
});

test("sepay webhook accepts Authorization Apikey header", async () => {
  let markPaidCalls = 0;
  const controller = new WebhookController(
    new SepayService(
      new ConfigService({
        SEPAY_BANK_NAME: "MBBank",
        SEPAY_BANK_ACCOUNT: "0123456789",
        SEPAY_ACCOUNT_HOLDER: "CYNEX COMPANY",
        SEPAY_WEBHOOK_SECRET: "secret",
      }),
    ),
    {
      findPendingPayment: async () => ({ id: "p1", amount: 1000 }),
      markPaid: async () => {
        markPaidCalls += 1;
        return { handled: true };
      },
    } as any,
  );

  const result = await controller.sepayWebhook(
    { authorization: "Apikey secret" } as any,
    { transferContent: "SEP123", amount: 1000, transactionId: "txn-1" },
  );

  assert.deepEqual(result, { success: true, handled: true });
  assert.equal(markPaidCalls, 1);
});

test("sepay webhook marks an order payment as paid", async () => {
  const prisma = new PrismaClient();
  const wallet = new WalletService(prisma as any);
  const queueStub = { enqueueEmail: async () => {} };
  const config = new ConfigService({
    SEPAY_BANK_NAME: "MBBank",
    SEPAY_BANK_ACCOUNT: "0123456789",
    SEPAY_ACCOUNT_HOLDER: "CYNEX COMPANY",
    SEPAY_WEBHOOK_SECRET: "secret",
  });
  const paymentService = new PaymentService(
    prisma as any,
    new SepayService(config) as any,
    queueStub as any,
    config as any,
    wallet,
  );
  const controller = new WebhookController(new SepayService(config), paymentService);

  const user = await prisma.user.create({
    data: { email: `webhook-order-${Date.now()}@test.com`, passwordHash: "x" },
  });
  const variant = await prisma.productVariant.findFirstOrThrow();
  const order = await prisma.order.create({
    data: {
      orderCode: `WH-${Date.now()}`,
      userId: user.id,
      totalAmount: 88000,
      items: {
        create: {
          productId: variant.productId,
          productVariantId: variant.id,
          quantity: 1,
          unitPrice: 88000,
          totalPrice: 88000,
          fulfillmentType: variant.fulfillmentType,
          fulfillment: { create: { fulfillmentType: variant.fulfillmentType } },
        },
      },
    },
  });
  const payment = await prisma.payment.create({
    data: {
      paymentCode: `SEPWH${Date.now()}`,
      orderId: order.id,
      userId: user.id,
      amount: 88000,
      provider: "sepay",
      status: "pending",
    },
  });

  try {
    const providerTxnId = `txn-webhook-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const result = await controller.sepayWebhook(
      { "x-sepay-secret": "secret" } as any,
      { transferContent: payment.paymentCode, amount: 88000, transactionId: providerTxnId },
    );

    assert.equal(result.success, true);
    const freshOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(freshOrder.paymentMethod, "sepay");
    assert.equal(freshOrder.paymentStatus, "paid");
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
  const { service, sepayCalls } = createPaymentService(prisma, config);

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
    assert.deepEqual(sepayCalls.map((call) => call.amount), [150000, 150000]);
    assert.deepEqual(sepayCalls.map((call) => call.paymentCode), [first.paymentCode, second.paymentCode]);

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
      ["cancelled", "pending"],
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

test("cancelled SePay order attempt does not settle after retry creates a new code", async () => {
  const prisma = new PrismaClient();
  const config = new ConfigService({
    SEPAY_BANK_NAME: "MBBank",
    SEPAY_BANK_ACCOUNT: "0123456789",
    SEPAY_ACCOUNT_HOLDER: "CYNEX COMPANY",
    SEPAY_QR_TEMPLATE: "compact",
  });
  const wallet = new WalletService(prisma as any);
  let emailCalls = 0;
  const queueStub = {
    enqueueEmail: async () => {
      emailCalls += 1;
    },
  };
  const { service } = createPaymentService(prisma, config);

  const guardedService = new PaymentService(
    prisma as any,
    {
      createPaymentPayload: ({ paymentCode, amount }: { paymentCode: string; amount: number }) => ({
        paymentCode,
        amount,
        qrCode: `sepay-qr-${paymentCode}`,
        bankName: "MBBank",
        bankAccount: "0123456789",
        accountHolder: "CYNEX COMPANY",
        transferContent: paymentCode,
      }),
    } as any,
    queueStub as any,
    config,
    wallet,
  );

  const user = await prisma.user.create({
    data: { email: `sepay-cancel-${Date.now()}@test.com`, passwordHash: "x" },
  });
  const variant = await prisma.productVariant.findFirstOrThrow();
  const order = await prisma.order.create({
    data: {
      orderCode: `SEPAY-CANCEL-${Date.now()}`,
      userId: user.id,
      totalAmount: 33000,
      items: {
        create: {
          productId: variant.productId,
          productVariantId: variant.id,
          quantity: 1,
          unitPrice: 33000,
          totalPrice: 33000,
          fulfillmentType: variant.fulfillmentType,
          fulfillment: { create: { fulfillmentType: variant.fulfillmentType } },
        },
      },
    },
  });

  try {
    const first = await service.createOrderPayment(user.id, order.orderCode);
    const second = await service.createOrderPayment(user.id, order.orderCode);

    const staleResult = await guardedService.markPaid(first.paymentCode, "txn-stale", { stale: true });

    assert.equal(staleResult.handled, true);
    assert.equal(staleResult.duplicate, true);
    assert.notEqual(first.paymentCode, second.paymentCode);
    assert.equal(emailCalls, 0);

    const payments = await prisma.payment.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: "asc" },
    });
    assert.deepEqual(
      payments.map((payment) => ({ paymentCode: payment.paymentCode, status: payment.status })),
      [
        { paymentCode: first.paymentCode, status: "cancelled" },
        { paymentCode: second.paymentCode, status: "pending" },
      ],
    );

    const freshOrder = await prisma.order.findUniqueOrThrow({ where: { id: order.id } });
    assert.equal(freshOrder.paymentStatus, "pending");
    assert.equal(freshOrder.fulfillmentStatus, "waiting_payment");
  } finally {
    await prisma.payment.deleteMany({ where: { orderId: order.id } });
    await prisma.orderFulfillment.deleteMany({ where: { orderItem: { orderId: order.id } } });
    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    await prisma.order.delete({ where: { id: order.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }
});
