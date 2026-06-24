import { after, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@cynex/db";
import { ConflictException } from "@nestjs/common";
import { AdminSourcesController } from "../src/admin/sources/admin-sources.controller";
import { AdminSourceOrdersController } from "../src/admin/sources/admin-source-orders.controller";
import { AdminAuditLogsController } from "../src/admin/logs/admin-audit-logs.controller";
import { AdminEmailLogsController } from "../src/admin/logs/admin-email-logs.controller";
import { AdminAccountsController } from "../src/admin/inventory/admin-accounts.controller";
import { AdminKeysController } from "../src/admin/inventory/admin-keys.controller";
import { AdminIntegrityService } from "../src/admin/integrity/admin-integrity.service";
import { AdminUsersController } from "../src/admin/users/admin-users.controller";
import { AdminProductsController } from "../src/admin/catalog/admin-products.controller";
import { AdminVariantsController } from "../src/admin/catalog/admin-variants.controller";
import { AdminOrdersController } from "../src/admin/orders/admin-orders.controller";

const prisma = new PrismaClient();

after(async () => {
  await prisma.$disconnect();
});

test("deleting a supply source is blocked when dependent inventory accounts exist", async () => {
  const now = Date.now();

  const category = await prisma.category.create({
    data: {
      name: `Integrity Category ${now}`,
      slug: `integrity-category-${now}`,
    },
    select: { id: true },
  });

  const product = await prisma.product.create({
    data: {
      categoryId: category.id,
      name: `Integrity Product ${now}`,
      slug: `integrity-product-${now}`,
      status: "active",
    },
    select: { id: true },
  });

  const source = await prisma.supplySource.create({
    data: {
      name: `Delete Blocked Source ${now}`,
      slug: `delete-blocked-source-${now}`,
    },
    select: { id: true },
  });

  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      name: `Integrity Variant ${now}`,
      slug: `integrity-variant-${now}`,
      price: 1000,
      fulfillmentType: "SHARED_ACCOUNT",
      status: "active",
    },
    select: { id: true },
  });

  const user = await prisma.user.create({
    data: {
      email: `integrity-${now}@test.com`,
      passwordHash: "x",
      name: "Integrity User",
    },
    select: { id: true },
  });

  const order = await prisma.order.create({
    data: {
      orderCode: `INT${now}`,
      userId: user.id,
      totalAmount: 1000,
      paymentStatus: "paid",
      fulfillmentStatus: "assigned",
      paidAt: new Date(),
    },
    select: { id: true },
  });

  const orderItem = await prisma.orderItem.create({
    data: {
      orderId: order.id,
      productId: product.id,
      productVariantId: variant.id,
      quantity: 1,
      unitPrice: 1000,
      totalPrice: 1000,
      fulfillmentType: "SHARED_ACCOUNT",
      status: "assigned",
    },
    select: { id: true },
  });

  const account = await prisma.inventoryAccount.create({
    data: {
      productVariantId: variant.id,
      sourceId: source.id,
      username: `blocked-${now}`,
      passwordEncrypted: "encrypted",
    },
    select: { id: true },
  });

  const warrantyCase = await prisma.warrantyCase.create({
    data: {
      userId: user.id,
      orderId: order.id,
      orderItemId: orderItem.id,
      sourceId: source.id,
      reason: "cannot_login",
    },
    select: { id: true },
  });

  const integrity = new AdminIntegrityService(prisma as any);
  const controller = new AdminSourcesController(prisma as any, {} as any, integrity);

  try {
    const preflight = await integrity.getSupplySourceDeletePreflight(source.id);

    assert.equal(preflight.canDelete, false);
    assert.deepEqual(
      preflight.blockingDependencies.map((dependency) => dependency.resource),
      ["inventory_accounts", "warranty_cases"],
    );
    assert.deepEqual(preflight.blockingDependencies, [
      {
        resource: "inventory_accounts",
        count: 1,
        sampleIds: [account.id],
      },
      {
        resource: "warranty_cases",
        count: 1,
        sampleIds: [warrantyCase.id],
      },
    ]);

    await assert.rejects(() => controller.remove(source.id), (error: unknown) => {
      assert.ok(error instanceof ConflictException);
      assert.deepEqual((error as ConflictException).getResponse(), {
        message: "Không thể xóa nguồn cung vì vẫn còn dữ liệu liên kết.",
        resource: "supply_sources",
        id: source.id,
        blockingDependencies: [
          {
            resource: "inventory_accounts",
            count: 1,
            sampleIds: [account.id],
          },
          {
            resource: "warranty_cases",
            count: 1,
            sampleIds: [warrantyCase.id],
          },
        ],
      });
      return true;
    });
  } finally {
    await prisma.warrantyCase.delete({ where: { id: warrantyCase.id } }).catch(() => {});
    await prisma.inventoryAccount.delete({ where: { id: account.id } }).catch(() => {});
    await prisma.orderItem.delete({ where: { id: orderItem.id } }).catch(() => {});
    await prisma.order.delete({ where: { id: order.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    await prisma.productVariant.delete({ where: { id: variant.id } }).catch(() => {});
    await prisma.product.delete({ where: { id: product.id } }).catch(() => {});
    await prisma.category.delete({ where: { id: category.id } }).catch(() => {});
    await prisma.supplySource.delete({ where: { id: source.id } }).catch(() => {});
  }
});

test("deleting a supply source hard-deletes it when no dependencies exist", async () => {
  const now = Date.now();

  const source = await prisma.supplySource.create({
    data: {
      name: `Delete Safe Source ${now}`,
      slug: `delete-safe-source-${now}`,
    },
    select: { id: true },
  });

  const integrity = new AdminIntegrityService(prisma as any);
  const controller = new AdminSourcesController(prisma as any, {} as any, integrity);

  const preflight = await integrity.getSupplySourceDeletePreflight(source.id);
  assert.equal(preflight.canDelete, true);
  assert.deepEqual(preflight.blockingDependencies, []);

  const result = await controller.remove(source.id);
  assert.equal(result.data.id, source.id);

  const deleted = await prisma.supplySource.findUnique({ where: { id: source.id } });
  assert.equal(deleted, null);
});

test("deleting a product is blocked when dependent variants or order items exist", async () => {
  const now = Date.now();
  const admin = await prisma.admin.findFirstOrThrow({ select: { id: true } });

  const category = await prisma.category.create({
    data: {
      name: `Product Delete Category ${now}`,
      slug: `product-delete-category-${now}`,
    },
  });
  const product = await prisma.product.create({
    data: {
      categoryId: category.id,
      name: `Product Delete ${now}`,
      slug: `product-delete-${now}`,
      status: "active",
    },
  });
  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      name: `Product Delete Variant ${now}`,
      slug: `product-delete-variant-${now}`,
      price: 1000,
      fulfillmentType: "LICENSE_KEY",
      status: "active",
    },
  });
  const user = await prisma.user.create({
    data: {
      email: `product-delete-${now}@test.com`,
      passwordHash: "x",
    },
  });
  const order = await prisma.order.create({
    data: {
      orderCode: `PDEL${now}`,
      userId: user.id,
      totalAmount: 1000,
      paymentStatus: "pending",
      fulfillmentStatus: "waiting_payment",
    },
  });
  const orderItem = await prisma.orderItem.create({
    data: {
      orderId: order.id,
      productId: product.id,
      productVariantId: variant.id,
      quantity: 1,
      unitPrice: 1000,
      totalPrice: 1000,
      fulfillmentType: "LICENSE_KEY",
      status: "waiting_payment",
    },
  });

  const integrity = new AdminIntegrityService(prisma as any);
  const controller = new AdminProductsController(
    prisma as any,
    { logAdminAction: async () => undefined } as any,
    { assertAdminOwnsFiles: async () => undefined } as any,
    integrity,
  );

  try {
    const preflight = await integrity.getProductDeletePreflight(product.id);
    assert.equal(preflight.canDelete, false);
    assert.deepEqual(preflight.blockingDependencies, [
      {
        resource: "product_variants",
        count: 1,
        sampleIds: [variant.id],
      },
      {
        resource: "order_items",
        count: 1,
        sampleIds: [orderItem.id],
      },
    ]);

    await assert.rejects(() => controller.remove(admin as any, product.id), (error: unknown) => {
      assert.ok(error instanceof ConflictException);
      assert.deepEqual((error as ConflictException).getResponse(), {
        message: "Không thể xóa sản phẩm vì vẫn còn dữ liệu liên kết.",
        resource: "products",
        id: product.id,
        blockingDependencies: [
          {
            resource: "product_variants",
            count: 1,
            sampleIds: [variant.id],
          },
          {
            resource: "order_items",
            count: 1,
            sampleIds: [orderItem.id],
          },
        ],
      });
      return true;
    });
  } finally {
    await prisma.order.delete({ where: { id: order.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    await prisma.product.delete({ where: { id: product.id } }).catch(() => {});
    await prisma.category.delete({ where: { id: category.id } }).catch(() => {});
  }
});

test("deleting a product hard-deletes it when no dependencies exist", async () => {
  const now = Date.now();
  const admin = await prisma.admin.findFirstOrThrow({ select: { id: true } });

  const category = await prisma.category.create({
    data: {
      name: `Product Delete Safe Category ${now}`,
      slug: `product-delete-safe-category-${now}`,
    },
  });
  const product = await prisma.product.create({
    data: {
      categoryId: category.id,
      name: `Product Delete Safe ${now}`,
      slug: `product-delete-safe-${now}`,
      status: "active",
    },
  });

  const integrity = new AdminIntegrityService(prisma as any);
  const controller = new AdminProductsController(
    prisma as any,
    { logAdminAction: async () => undefined } as any,
    { assertAdminOwnsFiles: async () => undefined } as any,
    integrity,
  );

  try {
    const result = await controller.remove(admin as any, product.id);
    assert.equal(result.data.id, product.id);

    const deleted = await prisma.product.findUnique({ where: { id: product.id } });
    assert.equal(deleted, null);
  } finally {
    await prisma.product.delete({ where: { id: product.id } }).catch(() => {});
    await prisma.category.delete({ where: { id: category.id } }).catch(() => {});
  }
});

test("deleting a variant is blocked when dependent inventory or order rows exist", async () => {
  const now = Date.now();
  const admin = await prisma.admin.findFirstOrThrow({ select: { id: true } });

  const category = await prisma.category.create({
    data: {
      name: `Variant Delete Category ${now}`,
      slug: `variant-delete-category-${now}`,
    },
  });
  const product = await prisma.product.create({
    data: {
      categoryId: category.id,
      name: `Variant Delete Product ${now}`,
      slug: `variant-delete-product-${now}`,
      status: "active",
    },
  });
  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      name: `Variant Delete ${now}`,
      slug: `variant-delete-${now}`,
      price: 1000,
      fulfillmentType: "LICENSE_KEY",
      status: "active",
    },
  });
  const account = await prisma.inventoryAccount.create({
    data: {
      productVariantId: variant.id,
      sourceId: null,
      username: `variant-delete-account-${now}`,
      passwordEncrypted: "encrypted",
    },
  });
  const key = await prisma.inventoryKey.create({
    data: {
      productVariantId: variant.id,
      sourceId: null,
      keyEncrypted: "encrypted",
    },
  });

  const integrity = new AdminIntegrityService(prisma as any);
  const controller = new AdminVariantsController(
    prisma as any,
    { logAdminAction: async () => undefined } as any,
    integrity,
  );

  try {
    const preflight = await integrity.getVariantDeletePreflight(variant.id);
    assert.equal(preflight.canDelete, false);
    assert.deepEqual(preflight.blockingDependencies, [
      {
        resource: "inventory_accounts",
        count: 1,
        sampleIds: [account.id],
      },
      {
        resource: "inventory_keys",
        count: 1,
        sampleIds: [key.id],
      },
    ]);

    await assert.rejects(() => controller.remove(admin as any, variant.id), (error: unknown) => {
      assert.ok(error instanceof ConflictException);
      assert.deepEqual((error as ConflictException).getResponse(), {
        message: "Không thể xóa biến thể sản phẩm vì vẫn còn dữ liệu liên kết.",
        resource: "product_variants",
        id: variant.id,
        blockingDependencies: [
          {
            resource: "inventory_accounts",
            count: 1,
            sampleIds: [account.id],
          },
          {
            resource: "inventory_keys",
            count: 1,
            sampleIds: [key.id],
          },
        ],
      });
      return true;
    });
  } finally {
    await prisma.inventoryKey.delete({ where: { id: key.id } }).catch(() => {});
    await prisma.inventoryAccount.delete({ where: { id: account.id } }).catch(() => {});
    await prisma.product.delete({ where: { id: product.id } }).catch(() => {});
    await prisma.category.delete({ where: { id: category.id } }).catch(() => {});
  }
});

test("deleting a variant hard-deletes it when no dependencies exist", async () => {
  const now = Date.now();
  const admin = await prisma.admin.findFirstOrThrow({ select: { id: true } });

  const category = await prisma.category.create({
    data: {
      name: `Variant Delete Safe Category ${now}`,
      slug: `variant-delete-safe-category-${now}`,
    },
  });
  const product = await prisma.product.create({
    data: {
      categoryId: category.id,
      name: `Variant Delete Safe Product ${now}`,
      slug: `variant-delete-safe-product-${now}`,
      status: "active",
    },
  });
  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      name: `Variant Delete Safe ${now}`,
      slug: `variant-delete-safe-${now}`,
      price: 1000,
      fulfillmentType: "LICENSE_KEY",
      status: "active",
    },
  });

  const integrity = new AdminIntegrityService(prisma as any);
  const controller = new AdminVariantsController(
    prisma as any,
    { logAdminAction: async () => undefined } as any,
    integrity,
  );

  try {
    const result = await controller.remove(admin as any, variant.id);
    assert.equal(result.data.id, variant.id);

    const deleted = await prisma.productVariant.findUnique({ where: { id: variant.id } });
    assert.equal(deleted, null);
  } finally {
    await prisma.product.delete({ where: { id: product.id } }).catch(() => {});
    await prisma.category.delete({ where: { id: category.id } }).catch(() => {});
  }
});

test("deleting an order hard-deletes the row and its dependent child records", async () => {
  const now = Date.now();
  const admin = await prisma.admin.findFirstOrThrow({ select: { id: true } });

  const category = await prisma.category.create({
    data: {
      name: `Order Delete Category ${now}`,
      slug: `order-delete-category-${now}`,
    },
  });
  const product = await prisma.product.create({
    data: {
      categoryId: category.id,
      name: `Order Delete Product ${now}`,
      slug: `order-delete-product-${now}`,
      status: "active",
    },
  });
  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      name: `Order Delete Variant ${now}`,
      slug: `order-delete-variant-${now}`,
      price: 1000,
      fulfillmentType: "SHARED_ACCOUNT",
      status: "active",
    },
  });
  const user = await prisma.user.create({
    data: {
      email: `order-delete-${now}@test.com`,
      passwordHash: "x",
    },
  });
  const order = await prisma.order.create({
    data: {
      orderCode: `ODEL${now}`,
      userId: user.id,
      totalAmount: 1000,
      paymentStatus: "paid",
      fulfillmentStatus: "assigned",
      paidAt: new Date(),
    },
  });
  const orderItem = await prisma.orderItem.create({
    data: {
      orderId: order.id,
      productId: product.id,
      productVariantId: variant.id,
      quantity: 1,
      unitPrice: 1000,
      totalPrice: 1000,
      fulfillmentType: "SHARED_ACCOUNT",
      status: "assigned",
    },
  });
  const account = await prisma.inventoryAccount.create({
    data: {
      productVariantId: variant.id,
      username: `order-delete-account-${now}`,
      passwordEncrypted: "encrypted",
    },
  });
  const allocation = await prisma.accountAllocation.create({
    data: {
      inventoryAccountId: account.id,
      userId: user.id,
      orderItemId: orderItem.id,
    },
  });
  const key = await prisma.inventoryKey.create({
    data: {
      productVariantId: variant.id,
      keyEncrypted: "encrypted",
      soldOrderItemId: orderItem.id,
    },
  });
  const payment = await prisma.payment.create({
    data: {
      paymentCode: `PAY${now}`,
      orderId: order.id,
      userId: user.id,
      amount: 1000,
      provider: "manual",
      status: "paid",
      paidAt: new Date(),
    },
  });
  const email = await prisma.emailLog.create({
    data: {
      userId: user.id,
      orderId: order.id,
      type: "payment_confirmed",
      toEmail: user.email,
      subject: "Order delete cleanup",
      bodySnapshot: "<p>cleanup</p>",
      status: "sent",
      dedupeKey: `order-delete-email:${order.id}:${now}`,
      sentByAdminId: admin.id,
      sentAt: new Date(),
    },
  });
  const warrantyCase = await prisma.warrantyCase.create({
    data: {
      userId: user.id,
      orderId: order.id,
      orderItemId: orderItem.id,
      reason: "cannot_login",
    },
  });

  const integrity = new AdminIntegrityService(prisma as any);
  const controller = new AdminOrdersController(
    prisma as any,
    integrity,
    { logAdminAction: async () => undefined } as any,
  );

  try {
    const preflight = await integrity.getOrderDeletePreflight(order.id);
    assert.equal(preflight.canDelete, true);
    assert.deepEqual(preflight.blockingDependencies, []);

    const result = await controller.remove(admin as any, order.id);
    assert.equal(result.data.id, order.id);

    const [deletedOrder, deletedPayment, deletedEmail, deletedWarranty, deletedAllocation, resetKey] = await Promise.all([
      prisma.order.findUnique({ where: { id: order.id } }),
      prisma.payment.findUnique({ where: { id: payment.id } }),
      prisma.emailLog.findUnique({ where: { id: email.id } }),
      prisma.warrantyCase.findUnique({ where: { id: warrantyCase.id } }),
      prisma.accountAllocation.findUnique({ where: { id: allocation.id } }),
      prisma.inventoryKey.findUnique({ where: { id: key.id } }),
    ]);

    assert.equal(deletedOrder, null);
    assert.equal(deletedPayment, null);
    assert.equal(deletedEmail, null);
    assert.equal(deletedWarranty, null);
    assert.equal(deletedAllocation, null);
    assert.equal(resetKey?.soldOrderItemId ?? null, null);
  } finally {
    await prisma.payment.delete({ where: { id: payment.id } }).catch(() => {});
    await prisma.emailLog.delete({ where: { id: email.id } }).catch(() => {});
    await prisma.warrantyCase.delete({ where: { id: warrantyCase.id } }).catch(() => {});
    await prisma.accountAllocation.delete({ where: { id: allocation.id } }).catch(() => {});
    await prisma.inventoryKey.delete({ where: { id: key.id } }).catch(() => {});
    await prisma.inventoryAccount.delete({ where: { id: account.id } }).catch(() => {});
    await prisma.order.delete({ where: { id: order.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: user.id } }).catch(() => {});
    await prisma.product.delete({ where: { id: product.id } }).catch(() => {});
    await prisma.category.delete({ where: { id: category.id } }).catch(() => {});
  }
});

test("deleting an email log hard-deletes the row", async () => {
  const user = await prisma.user.create({
    data: { email: `integrity-email-log-${Date.now()}@test.com`, passwordHash: "x" },
  });
  const email = await prisma.emailLog.create({
    data: {
      userId: user.id,
      type: "refund",
      toEmail: user.email,
      subject: "Delete me",
      bodySnapshot: "<p>Delete me</p>",
      status: "sent",
      dedupeKey: `integrity-email-log:${user.id}:${Date.now()}`,
      sentByAdminId: (await prisma.admin.findFirstOrThrow()).id,
      sentAt: new Date(),
    },
  });

  const controller = new AdminEmailLogsController(prisma as any);

  try {
    const result = await controller.remove(email.id);
    assert.equal(result.data.id, email.id);

    const deleted = await prisma.emailLog.findUnique({ where: { id: email.id } });
    assert.equal(deleted, null);
  } finally {
    await prisma.emailLog.delete({ where: { id: email.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: user.id } });
  }
});

test("deleting an audit log uses integrity preflight and hard-deletes the row", async () => {
  const admin = await prisma.admin.findFirstOrThrow();
  const log = await prisma.auditLog.create({
    data: {
      actorType: "admin",
      actorId: admin.id,
      action: "ADMIN_REFUND_ORDER",
      targetType: "order",
      targetId: `audit-log-delete-${Date.now()}`,
      metadata: { reason: "cleanup" },
    },
  });

  const integrity = new AdminIntegrityService(prisma as any);
  const controller = new AdminAuditLogsController(prisma as any, integrity);

  try {
    const preflight = await integrity.getAuditLogDeletePreflight(log.id);
    assert.equal(preflight.canDelete, true);
    assert.deepEqual(preflight.blockingDependencies, []);

    const result = await controller.remove(log.id);
    assert.equal(result.data.id, log.id);

    const deleted = await prisma.auditLog.findUnique({ where: { id: log.id } });
    assert.equal(deleted, null);
  } finally {
    await prisma.auditLog.delete({ where: { id: log.id } }).catch(() => {});
  }
});

test("touched admin payloads always include integrityWarnings arrays", async () => {
  const now = Date.now();
  const source = await prisma.supplySource.create({
    data: {
      name: `Warnings Source ${now}`,
      slug: `warnings-source-${now}`,
    },
  });

  const emailUser = await prisma.user.create({
    data: { email: `integrity-warnings-email-${now}@test.com`, passwordHash: "x" },
  });
  const email = await prisma.emailLog.create({
    data: {
      userId: emailUser.id,
      type: "refund",
      toEmail: emailUser.email,
      subject: "Warnings check",
      bodySnapshot: "<p>Warnings check</p>",
      status: "sent",
      dedupeKey: `integrity-warnings:${emailUser.id}:${now}`,
      sentByAdminId: (await prisma.admin.findFirstOrThrow()).id,
      sentAt: new Date(),
    },
  });

  const auditUser = await prisma.user.create({
    data: { email: `integrity-warnings-audit-${now}@test.com`, passwordHash: "x" },
  });
  const auditOrder = await prisma.order.create({
    data: {
      orderCode: `WARN${now}`,
      userId: auditUser.id,
      totalAmount: 1000,
      paymentStatus: "paid",
      fulfillmentStatus: "assigned",
      paidAt: new Date(),
    },
  });
  const admin = await prisma.admin.findFirstOrThrow();
  const log = await prisma.auditLog.create({
    data: {
      actorType: "admin",
      actorId: admin.id,
      action: "ADMIN_REFUND_ORDER",
      targetType: "order",
      targetId: auditOrder.id,
      metadata: { reason: "verify warnings field" },
    },
  });

  const integrity = new AdminIntegrityService(prisma as any);
  const sources = new AdminSourcesController(prisma as any, {} as any, integrity);
  const emailLogs = new AdminEmailLogsController(prisma as any, integrity);
  const auditLogs = new AdminAuditLogsController(prisma as any, integrity);
  const users = new AdminUsersController(prisma as any, {} as any, {} as any);

  try {
    const sourceList = await sources.list({ filter: JSON.stringify({ q: "Warnings Source" }) });
    const sourceListRow = sourceList.data.find((row: any) => row.id === source.id);
    assert.deepEqual(sourceListRow?.integrityWarnings, []);

    const sourceDetail = await sources.getOne(source.id);
    assert.deepEqual(sourceDetail.data.integrityWarnings, []);

    const emailList = await emailLogs.list({
      page: "1",
      perPage: "25",
      filter: JSON.stringify({ q: "Warnings check" }),
    });
    const emailListRow = emailList.data.find((row: any) => row.id === email.id);
    assert.deepEqual(emailListRow?.integrityWarnings, []);

    const emailDetail = await emailLogs.getOne(email.id);
    assert.deepEqual(emailDetail.data.integrityWarnings, []);

    await users.delete(auditUser.id);

    const auditList = await auditLogs.list({
      page: "1",
      perPage: "25",
      filter: JSON.stringify({ targetId: log.targetId }),
    });
    const auditListRow = auditList.data.find((row: any) => row.id === log.id);
    assert.deepEqual(auditListRow?.integrityWarnings, [
      {
        code: "missing_order",
        message: "Audit log references an order that no longer exists.",
        field: "targetId",
        relatedResource: "orders",
        relatedId: auditOrder.id,
      },
    ]);

    const auditDetail = await auditLogs.getOne(log.id);
    assert.deepEqual(auditDetail.data.integrityWarnings, [
      {
        code: "missing_order",
        message: "Audit log references an order that no longer exists.",
        field: "targetId",
        relatedResource: "orders",
        relatedId: auditOrder.id,
      },
    ]);
  } finally {
    await prisma.auditLog.delete({ where: { id: log.id } }).catch(() => {});
    await prisma.emailLog.delete({ where: { id: email.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: emailUser.id } }).catch(() => {});
    await prisma.order.delete({ where: { id: auditOrder.id } }).catch(() => {});
    await prisma.user.delete({ where: { id: auditUser.id } }).catch(() => {});
    await prisma.supplySource.delete({ where: { id: source.id } }).catch(() => {});
  }
});

test("inventory account and key payloads warn when source is missing through nullable links", async () => {
  const now = Date.now();

  const category = await prisma.category.create({
    data: {
      name: `Integrity Warning Category ${now}`,
      slug: `integrity-warning-category-${now}`,
    },
  });
  const product = await prisma.product.create({
    data: {
      categoryId: category.id,
      name: `Integrity Warning Product ${now}`,
      slug: `integrity-warning-product-${now}`,
      status: "active",
    },
  });
  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      name: `Integrity Warning Variant ${now}`,
      slug: `integrity-warning-variant-${now}`,
      price: 1000,
      fulfillmentType: "LICENSE_KEY",
      status: "active",
    },
  });
  const account = await prisma.inventoryAccount.create({
    data: {
      productVariantId: variant.id,
      sourceId: null,
      username: `warning-account-${now}`,
      passwordEncrypted: "encrypted",
    },
  });
  const key = await prisma.inventoryKey.create({
    data: {
      productVariantId: variant.id,
      sourceId: null,
      keyEncrypted: "encrypted",
    },
  });

  const integrity = new AdminIntegrityService(prisma as any);
  const accounts = new AdminAccountsController(prisma as any, integrity);
  const keys = new AdminKeysController(prisma as any, integrity);

  try {
    const accountList = await accounts.list({
      page: "1",
      perPage: "25",
      filter: JSON.stringify({ productVariantId: variant.id }),
    });
    const accountListRow = accountList.data.find((row: any) => row.id === account.id);
    assert.deepEqual(accountListRow?.integrityWarnings, [
      {
        code: "missing_source",
        message: "Inventory account is not linked to a supply source.",
        field: "sourceId",
        relatedResource: "supply_sources",
      },
    ]);

    const accountDetail = await accounts.getOne(account.id);
    assert.deepEqual(accountDetail.data.integrityWarnings, [
      {
        code: "missing_source",
        message: "Inventory account is not linked to a supply source.",
        field: "sourceId",
        relatedResource: "supply_sources",
      },
    ]);

    const keyList = await keys.list({
      page: "1",
      perPage: "25",
      filter: JSON.stringify({ productVariantId: variant.id }),
    });
    const keyListRow = keyList.data.find((row: any) => row.id === key.id);
    assert.deepEqual(keyListRow?.integrityWarnings, [
      {
        code: "missing_source",
        message: "Inventory key is not linked to a supply source.",
        field: "sourceId",
        relatedResource: "supply_sources",
      },
    ]);

    const keyDetail = await keys.getOne(key.id);
    assert.deepEqual(keyDetail.data.integrityWarnings, [
      {
        code: "missing_source",
        message: "Inventory key is not linked to a supply source.",
        field: "sourceId",
        relatedResource: "supply_sources",
      },
    ]);
  } finally {
    await prisma.inventoryKey.delete({ where: { id: key.id } }).catch(() => {});
    await prisma.inventoryAccount.delete({ where: { id: account.id } }).catch(() => {});
    await prisma.productVariant.delete({ where: { id: variant.id } }).catch(() => {});
    await prisma.product.delete({ where: { id: product.id } }).catch(() => {});
    await prisma.category.delete({ where: { id: category.id } }).catch(() => {});
  }
});

test("warning calculators flag broken variant and source links when a loaded relation is missing", async () => {
  const integrity = new AdminIntegrityService({} as any);

  assert.deepEqual(
    integrity.getInventoryAccountWarnings({
      id: "acct-broken",
      productVariantId: "variant-missing",
      sourceId: "source-missing",
      variant: null,
      source: null,
    } as any),
    [
      {
        code: "missing_variant",
        message: "Inventory account references a product variant that no longer exists.",
        field: "productVariantId",
        relatedResource: "product_variants",
        relatedId: "variant-missing",
      },
      {
        code: "missing_source",
        message: "Inventory account references a supply source that no longer exists.",
        field: "sourceId",
        relatedResource: "supply_sources",
        relatedId: "source-missing",
      },
    ],
  );

  assert.deepEqual(
    integrity.getInventoryKeyWarnings({
      id: "key-broken",
      productVariantId: "variant-missing",
      sourceId: "source-missing",
      variant: null,
      source: null,
    } as any),
    [
      {
        code: "missing_variant",
        message: "Inventory key references a product variant that no longer exists.",
        field: "productVariantId",
        relatedResource: "product_variants",
        relatedId: "variant-missing",
      },
      {
        code: "missing_source",
        message: "Inventory key references a supply source that no longer exists.",
        field: "sourceId",
        relatedResource: "supply_sources",
        relatedId: "source-missing",
      },
    ],
  );

  assert.deepEqual(
    integrity.getSourceOrderWarnings({
      id: "source-order-broken",
      sourceId: "source-missing",
      source: null,
    } as any),
    [
      {
        code: "missing_source",
        message: "Source order references a supply source that no longer exists.",
        field: "sourceId",
        relatedResource: "supply_sources",
        relatedId: "source-missing",
      },
    ],
  );
});

test("source-order payloads include integrityWarnings arrays from integrity service", async () => {
  const controller = new AdminSourceOrdersController(
    {
      sourceOrder: {
        findMany: async () => [
          {
            id: "source-order-broken",
            sourceId: "source-missing",
            sourcePayloadEncrypted: "enc",
            source: null,
          },
        ],
        count: async () => 1,
        findUniqueOrThrow: async () => ({
          id: "source-order-broken",
          sourceId: "source-missing",
          sourcePayloadEncrypted: "enc",
          source: null,
        }),
      },
    } as any,
    new AdminIntegrityService({} as any),
    { resolveFilesForAdmin: async () => [] } as any,
  );

  const list = await controller.list({ page: "1", perPage: "25" });
  assert.deepEqual(list.data[0].integrityWarnings, [
    {
      code: "missing_source",
      message: "Source order references a supply source that no longer exists.",
      field: "sourceId",
      relatedResource: "supply_sources",
      relatedId: "source-missing",
    },
  ]);

  const detail = await controller.getOne("source-order-broken");
  assert.deepEqual(detail.data.integrityWarnings, [
    {
      code: "missing_source",
      message: "Source order references a supply source that no longer exists.",
      field: "sourceId",
      relatedResource: "supply_sources",
      relatedId: "source-missing",
    },
  ]);
});
