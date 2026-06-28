import { after, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient, type WarrantyCase } from "@cynex/db";
import { AuditAction, encrypt } from "@cynex/shared";
import { AuditService } from "../src/audit/audit.service";
import { AdminWarrantyService } from "../src/admin/warranty/admin-warranty.service";
import { WarrantyReplacementService } from "../src/warranty/replace";

const prisma = new PrismaClient();
const files = {
  assertAdminOwnsFiles: async () => undefined,
  resolveFilesForAdmin: async () => [],
};
const audit = new AuditService(prisma as any);
const replacement = new WarrantyReplacementService(prisma as any, audit as any);
const service = new AdminWarrantyService(
  prisma as any,
  files as any,
  audit as any,
  replacement as any,
);

after(async () => {
  await prisma.$disconnect();
});

async function makeUser(emailPrefix: string) {
  return prisma.user.create({
    data: {
      email: `${emailPrefix}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@test.com`,
      passwordHash: "x",
    },
  });
}

async function makeDeliveredOrder(userId: string) {
  const variant = await prisma.productVariant.findFirstOrThrow({
    where: { warrantyDays: { gt: 0 } },
  });
  const deliveredAt = new Date();
  const order = await prisma.order.create({
    data: {
      orderCode: `AW${Date.now()}${Math.floor(Math.random() * 1e4)}`,
      userId,
      totalAmount: variant.price,
      paymentStatus: "paid",
      fulfillmentStatus: "delivered",
      paidAt: deliveredAt,
      deliveredAt,
      items: {
        create: {
          productId: variant.productId,
          productVariantId: variant.id,
          quantity: 1,
          unitPrice: variant.price,
          totalPrice: variant.price,
          fulfillmentType: variant.fulfillmentType,
          status: "delivered",
          fulfillment: {
            create: {
              fulfillmentType: variant.fulfillmentType,
              status: "delivered",
              deliveredAt,
            },
          },
        },
      },
    },
    include: {
      items: {
        include: {
          fulfillment: true,
        },
      },
    },
  });
  return { order, item: order.items[0]!, fulfillment: order.items[0]!.fulfillment! };
}

async function createCaseForUser(userId: string, orderId: string, orderItemId: string): Promise<WarrantyCase> {
  return prisma.warrantyCase.create({
    data: {
      userId,
      orderId,
      orderItemId,
      reason: "cannot_login",
      status: "open",
      messages: {
        create: {
          authorType: "user",
          authorId: userId,
          message: "Need help",
        },
      },
    },
  });
}

async function cleanupOrder(orderId: string) {
  const itemIds = (
    await prisma.orderItem.findMany({ where: { orderId }, select: { id: true } })
  ).map((item) => item.id);
  await prisma.orderFulfillment.deleteMany({ where: { orderItemId: { in: itemIds } } });
  await prisma.warrantyMessage.deleteMany({ where: { warrantyCase: { orderId } } });
  await prisma.warrantyCase.deleteMany({ where: { orderId } });
  await prisma.orderItem.deleteMany({ where: { orderId } });
  await prisma.order.delete({ where: { id: orderId } });
}

async function cleanupAuditForTarget(targetId: string) {
  await prisma.auditLog.deleteMany({ where: { targetId } });
}

test("admin can list and inspect warranty cases with user and order context", async () => {
  const user = await makeUser("admin-warranty-list");
  const { order, item } = await makeDeliveredOrder(user.id);
  const warrantyCase = await createCaseForUser(user.id, order.id, item.id);

  try {
    const list = await service.list({
      page: "1",
      perPage: "25",
      filter: JSON.stringify({ status: "open" }),
    });
    assert.equal(list.total >= 1, true);
    assert.equal(list.data.some((row: any) => row.id === warrantyCase.id), true);

    const detail = await service.getById(warrantyCase.id);
    assert.equal(detail.id, warrantyCase.id);
    assert.equal(detail.user.email, user.email);
    assert.equal(detail.order.orderCode, order.orderCode);
    assert.equal(detail.messages[0]?.message, "Need help");
  } finally {
    await cleanupOrder(order.id);
    await prisma.user.delete({ where: { id: user.id } });
  }
});

test("admin reply appends a message and moves the case to waiting_customer", async () => {
  const admin = await prisma.admin.findFirstOrThrow();
  const user = await makeUser("admin-warranty-reply");
  const { order, item } = await makeDeliveredOrder(user.id);
  const warrantyCase = await createCaseForUser(user.id, order.id, item.id);

  try {
    const updated = await service.addMessage(admin.id, warrantyCase.id, {
      message: "Please try resetting the password first",
    });
    assert.equal(updated.status, "waiting_customer");
    assert.equal(updated.messages.length, 2);
    assert.equal(updated.messages[1]?.authorType, "admin");
  } finally {
    await cleanupOrder(order.id);
    await prisma.user.delete({ where: { id: user.id } });
  }
});

test("admin can update status and link source, source order, account, and key to a case", async () => {
  const user = await makeUser("admin-warranty-update");
  const { order, item, fulfillment } = await makeDeliveredOrder(user.id);
  const warrantyCase = await createCaseForUser(user.id, order.id, item.id);
  const source = await prisma.supplySource.create({
    data: {
      name: `Warranty Source ${Date.now()}`,
      slug: `warranty-source-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
    },
  });
  const sourceOrder = await prisma.sourceOrder.create({
    data: {
      sourceId: source.id,
      orderId: order.id,
      orderItemId: item.id,
      status: "ordered",
    },
  });
  const account = await prisma.inventoryAccount.create({
    data: {
      productVariantId: item.productVariantId,
      sourceId: source.id,
      username: `warranty-account-${Date.now()}`,
      passwordEncrypted: "encrypted",
      accountType: "dedicated",
      status: "available",
    },
  });
  const key = await prisma.inventoryKey.create({
    data: {
      productVariantId: item.productVariantId,
      sourceId: source.id,
      keyEncrypted: "encrypted",
      status: "available",
    },
  });

  try {
    const updated = await service.updateCase(warrantyCase.id, {
      status: "resolved",
      adminNote: "Replacement has been prepared",
      sourceId: source.id,
      sourceOrderId: sourceOrder.id,
      inventoryAccountId: account.id,
      inventoryKeyId: key.id,
    });

    assert.equal(updated.status, "resolved");
    assert.equal(updated.adminNote, "Replacement has been prepared");
    assert.equal(updated.sourceId, source.id);
    assert.equal(updated.sourceOrderId, sourceOrder.id);
    assert.equal(updated.inventoryAccountId, account.id);
    assert.equal(updated.inventoryKeyId, key.id);
    assert.ok(updated.closedAt, "resolved cases should record closedAt");
    assert.equal(updated.orderItem.fulfillment?.id, fulfillment.id);
  } finally {
    await prisma.inventoryKey.delete({ where: { id: key.id } });
    await prisma.inventoryAccount.delete({ where: { id: account.id } });
    await prisma.sourceOrder.delete({ where: { id: sourceOrder.id } });
    await prisma.supplySource.delete({ where: { id: source.id } });
    await cleanupOrder(order.id);
    await prisma.user.delete({ where: { id: user.id } });
  }
});

test("replacing a warranty account marks the old allocation as replaced and switches fulfillment to the new account", async () => {
  const admin = await prisma.admin.findFirstOrThrow();
  const user = await makeUser("admin-warranty-replace-account");
  const { order, item, fulfillment } = await makeDeliveredOrder(user.id);
  const oldAccount = await prisma.inventoryAccount.create({
    data: {
      productVariantId: item.productVariantId,
      username: `old-account-${Date.now()}`,
      passwordEncrypted: encrypt("old-password"),
      accountType: "dedicated",
      status: "delivered",
    },
  });
  const oldAllocation = await prisma.accountAllocation.create({
    data: {
      inventoryAccountId: oldAccount.id,
      userId: user.id,
      orderItemId: item.id,
      status: "active",
    },
  });
  await prisma.orderFulfillment.update({
    where: { id: fulfillment.id },
    data: {
      inventoryAccountId: oldAccount.id,
      accountAllocationId: oldAllocation.id,
      deliveredMessageEncrypted: encrypt("old delivered message"),
    },
  });
  const warrantyCase = await createCaseForUser(user.id, order.id, item.id);
  await prisma.warrantyCase.update({
    where: { id: warrantyCase.id },
    data: { inventoryAccountId: oldAccount.id },
  });
  const newAccount = await prisma.inventoryAccount.create({
    data: {
      productVariantId: item.productVariantId,
      username: `new-account-${Date.now()}`,
      passwordEncrypted: encrypt("new-password"),
      accountType: "dedicated",
      status: "available",
    },
  });

  try {
    const updated = await service.replaceAccount(warrantyCase.id, newAccount.id, admin.id);

    assert.equal(updated.status, "processing");
    assert.equal(updated.inventoryAccountId, newAccount.id);

    const freshFulfillment = await prisma.orderFulfillment.findUniqueOrThrow({
      where: { id: fulfillment.id },
    });
    assert.equal(freshFulfillment.inventoryAccountId, newAccount.id);
    assert.notEqual(freshFulfillment.accountAllocationId, oldAllocation.id);
    assert.equal(freshFulfillment.status, "delivered");

    const replacedAllocation = await prisma.accountAllocation.findUniqueOrThrow({
      where: { id: oldAllocation.id },
    });
    assert.equal(replacedAllocation.status, "replaced");
    assert.ok(replacedAllocation.endsAt);

    const oldAccountRow = await prisma.inventoryAccount.findUniqueOrThrow({
      where: { id: oldAccount.id },
    });
    assert.equal(oldAccountRow.status, "replaced");

    const newAccountRow = await prisma.inventoryAccount.findUniqueOrThrow({
      where: { id: newAccount.id },
    });
    assert.equal(newAccountRow.status, "delivered");

    const replacementAudit = await prisma.auditLog.findFirstOrThrow({
      where: {
        action: AuditAction.ADMIN_REPLACE_WARRANTY_ITEM,
        targetId: warrantyCase.id,
      },
      orderBy: { createdAt: "desc" },
    });
    assert.equal(replacementAudit.actorId, admin.id);
    assert.equal((replacementAudit.metadata as any).newInventoryAccountId, newAccount.id);
    assert.equal((replacementAudit.metadata as any).oldInventoryAccountId, oldAccount.id);
  } finally {
    await cleanupAuditForTarget(warrantyCase.id);
    await prisma.accountAllocation.deleteMany({
      where: { orderItemId: item.id },
    });
    await prisma.inventoryAccount.deleteMany({
      where: { id: { in: [oldAccount.id, newAccount.id] } },
    });
    await cleanupOrder(order.id);
    await prisma.user.delete({ where: { id: user.id } });
  }
});

test("replacing a warranty key marks the old key as replaced and switches fulfillment to the new key", async () => {
  const admin = await prisma.admin.findFirstOrThrow();
  const user = await makeUser("admin-warranty-replace-key");
  const { order, item, fulfillment } = await makeDeliveredOrder(user.id);
  const oldKey = await prisma.inventoryKey.create({
    data: {
      productVariantId: item.productVariantId,
      keyEncrypted: encrypt("OLD-KEY-123"),
      status: "delivered",
      soldOrderItemId: item.id,
      deliveredAt: new Date(),
    },
  });
  await prisma.orderFulfillment.update({
    where: { id: fulfillment.id },
    data: {
      inventoryKeyId: oldKey.id,
      deliveredMessageEncrypted: encrypt("old delivered message"),
    },
  });
  const warrantyCase = await createCaseForUser(user.id, order.id, item.id);
  await prisma.warrantyCase.update({
    where: { id: warrantyCase.id },
    data: { inventoryKeyId: oldKey.id },
  });
  const newKey = await prisma.inventoryKey.create({
    data: {
      productVariantId: item.productVariantId,
      keyEncrypted: encrypt("NEW-KEY-456"),
      status: "available",
    },
  });

  try {
    const updated = await service.replaceKey(warrantyCase.id, newKey.id, admin.id);

    assert.equal(updated.status, "processing");
    assert.equal(updated.inventoryKeyId, newKey.id);

    const freshFulfillment = await prisma.orderFulfillment.findUniqueOrThrow({
      where: { id: fulfillment.id },
    });
    assert.equal(freshFulfillment.inventoryKeyId, newKey.id);
    assert.equal(freshFulfillment.status, "delivered");

    const oldKeyRow = await prisma.inventoryKey.findUniqueOrThrow({ where: { id: oldKey.id } });
    assert.equal(oldKeyRow.status, "replaced");

    const newKeyRow = await prisma.inventoryKey.findUniqueOrThrow({ where: { id: newKey.id } });
    assert.equal(newKeyRow.status, "delivered");
    assert.equal(newKeyRow.soldOrderItemId, item.id);
    assert.ok(newKeyRow.deliveredAt);

    const replacementAudit = await prisma.auditLog.findFirstOrThrow({
      where: {
        action: AuditAction.ADMIN_REPLACE_WARRANTY_ITEM,
        targetId: warrantyCase.id,
      },
      orderBy: { createdAt: "desc" },
    });
    assert.equal(replacementAudit.actorId, admin.id);
    assert.equal((replacementAudit.metadata as any).newInventoryKeyId, newKey.id);
    assert.equal((replacementAudit.metadata as any).oldInventoryKeyId, oldKey.id);
  } finally {
    await cleanupAuditForTarget(warrantyCase.id);
    await prisma.inventoryKey.deleteMany({
      where: { id: { in: [oldKey.id, newKey.id] } },
    });
    await cleanupOrder(order.id);
    await prisma.user.delete({ where: { id: user.id } });
  }
});
