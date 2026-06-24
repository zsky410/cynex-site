import { after, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@cynex/db";
import { ConflictException } from "@nestjs/common";
import { AdminSourcesController } from "../src/admin/sources/admin-sources.controller";
import { AdminIntegrityService } from "../src/admin/integrity/admin-integrity.service";

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
      defaultSourceId: source.id,
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
  const controller = new AdminSourcesController(prisma as any, {} as any);

  try {
    const preflight = await integrity.getSupplySourceDeletePreflight(source.id);

    assert.equal(preflight.canDelete, false);
    assert.deepEqual(
      preflight.blockingDependencies.map((dependency) => dependency.resource),
      ["inventory_accounts", "product_variants", "warranty_cases"],
    );
    assert.deepEqual(preflight.blockingDependencies, [
      {
        resource: "inventory_accounts",
        count: 1,
        sampleIds: [account.id],
      },
      {
        resource: "product_variants",
        count: 1,
        sampleIds: [variant.id],
      },
      {
        resource: "warranty_cases",
        count: 1,
        sampleIds: [warrantyCase.id],
      },
    ]);

    await assert.rejects(
      () => controller.remove(source.id),
      (error: unknown) => error instanceof ConflictException,
    );
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
