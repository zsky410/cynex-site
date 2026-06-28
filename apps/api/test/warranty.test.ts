import { after, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient, type WarrantyCase } from "@cynex/db";
import { WarrantyService } from "../src/warranty/warranty.service";

const prisma = new PrismaClient();
const files = {
  assertUserOwnsFiles: async () => undefined,
  resolveFilesForUser: async () => [],
};
const service = new WarrantyService(prisma as any, files as any);

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

async function makeOrder(userId: string, status: "paid_waiting_admin" | "delivered") {
  const variant = await prisma.productVariant.findFirstOrThrow({
    where: { warrantyDays: { gt: 0 } },
  });
  const deliveredAt = status === "delivered" ? new Date() : null;
  const order = await prisma.order.create({
    data: {
      orderCode: `WC${Date.now()}${Math.floor(Math.random() * 1e4)}`,
      userId,
      totalAmount: variant.price,
      paymentStatus: "paid",
      fulfillmentStatus: status,
      paidAt: new Date(),
      deliveredAt,
      items: {
        create: {
          productId: variant.productId,
          productVariantId: variant.id,
          quantity: 1,
          unitPrice: variant.price,
          totalPrice: variant.price,
          fulfillmentType: variant.fulfillmentType,
          status,
          fulfillment: {
            create: {
              fulfillmentType: variant.fulfillmentType,
              status,
              deliveredAt,
            },
          },
        },
      },
    },
    include: { items: true },
  });
  return { order, item: order.items[0]! };
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

test("creates an open warranty case for the user's delivered item", async () => {
  const user = await makeUser("warranty-create");
  const { order, item } = await makeOrder(user.id, "delivered");

  try {
    const created = await service.create(user.id, {
      orderId: order.id,
      orderItemId: item.id,
      reason: "cannot_login",
      message: "Account can no longer log in",
    });
    assert.equal(created.status, "open");
    assert.equal(created.messages[0]?.message, "Account can no longer log in");
  } finally {
    await cleanupOrder(order.id);
    await prisma.user.delete({ where: { id: user.id } });
  }
});

test("rejects undelivered items", async () => {
  const user = await makeUser("warranty-undelivered");
  const { order, item } = await makeOrder(user.id, "paid_waiting_admin");

  try {
    await assert.rejects(
      () =>
        service.create(user.id, {
          orderId: order.id,
          orderItemId: item.id,
          reason: "cannot_login",
          message: "Still waiting but trying anyway",
        }),
      /đã giao|delivered/i,
    );
  } finally {
    await cleanupOrder(order.id);
    await prisma.user.delete({ where: { id: user.id } });
  }
});

test("list and detail are scoped to the owner", async () => {
  const owner = await makeUser("warranty-owner");
  const intruder = await makeUser("warranty-intruder");
  const ownerOrder = await makeOrder(owner.id, "delivered");
  const intruderOrder = await makeOrder(intruder.id, "delivered");
  const ownerCase = await createCaseForUser(owner.id, ownerOrder.order.id, ownerOrder.item.id);
  const intruderCase = await createCaseForUser(intruder.id, intruderOrder.order.id, intruderOrder.item.id);

  try {
    const list = await service.list(owner.id);
    assert.deepEqual(list.map((item) => item.id), [ownerCase.id]);

    const detail = await service.getById(owner.id, ownerCase.id);
    assert.equal(detail.id, ownerCase.id);
    assert.equal(detail.messages[0]?.message, "Need help");

    await assert.rejects(() => service.getById(intruder.id, ownerCase.id), /không tồn tại|not found/i);
  } finally {
    await cleanupOrder(ownerOrder.order.id);
    await cleanupOrder(intruderOrder.order.id);
    await prisma.user.deleteMany({ where: { id: { in: [owner.id, intruder.id] } } });
    await prisma.warrantyCase.deleteMany({ where: { id: { in: [ownerCase.id, intruderCase.id] } } });
  }
});

test("owner can append a warranty message to an existing case", async () => {
  const user = await makeUser("warranty-reply");
  const other = await makeUser("warranty-reply-other");
  const { order, item } = await makeOrder(user.id, "delivered");
  const warrantyCase = await createCaseForUser(user.id, order.id, item.id);

  try {
    const updated = await service.addMessage(user.id, warrantyCase.id, {
      message: "I have attached a clearer screenshot",
    });
    assert.equal(updated.messages.length, 2);
    assert.equal(updated.messages[1]?.message, "I have attached a clearer screenshot");

    await assert.rejects(
      () =>
        service.addMessage(other.id, warrantyCase.id, {
          message: "Trying to reply to someone else's case",
        }),
      /không tồn tại|not found/i,
    );
  } finally {
    await cleanupOrder(order.id);
    await prisma.user.deleteMany({ where: { id: { in: [user.id, other.id] } } });
  }
});
