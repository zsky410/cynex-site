import { after, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@cynex/db";
import { AdminCategoriesController } from "../src/admin/catalog/admin-categories.controller";

const prisma = new PrismaClient();

after(async () => {
  await prisma.$disconnect();
});

test("admin categories list/create/update/delete follow the admin contract and null linked products on delete", async () => {
  const now = Date.now();
  const admin = await prisma.admin.findFirstOrThrow({ select: { id: true } });

  const controller = new AdminCategoriesController(
    prisma as any,
    { logAdminAction: async () => undefined } as any,
  );

  const created = await controller.create(
    { id: admin.id } as any,
    {
      name: `Category ${now}`,
      slug: `category-${now}`,
    },
  );

  const product = await prisma.product.create({
    data: {
      categoryId: created.data.id,
      name: `Category Product ${now}`,
      slug: `category-product-${now}`,
      status: "active",
    },
    select: { id: true },
  });

  try {
    assert.equal(created.data.name, `Category ${now}`);
    assert.equal(created.data.slug, `category-${now}`);
    assert.equal(created.data.sortOrder, 0);

    const listed = await controller.list({
      filter: JSON.stringify({ q: `Category ${now}` }),
      sort: "name",
      order: "ASC",
    });
    assert.equal(listed.total >= 1, true);
    assert.equal(listed.data.some((row: { id: string }) => row.id === created.data.id), true);

    const fetched = await controller.getOne(created.data.id);
    assert.equal(fetched.data.id, created.data.id);

    const updated = await controller.update(
      { id: admin.id } as any,
      created.data.id,
      {
        name: `Renamed Category ${now}`,
      },
    );
    assert.equal(updated.data.name, `Renamed Category ${now}`);
    assert.equal(updated.data.sortOrder, 0);

    const deleted = await controller.remove({ id: admin.id } as any, created.data.id);
    assert.equal(deleted.data.id, created.data.id);

    const freshProduct = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      select: { categoryId: true },
    });
    assert.equal(freshProduct.categoryId, null);

    const freshCategory = await prisma.category.findUnique({ where: { id: created.data.id } });
    assert.equal(freshCategory, null);
  } finally {
    await prisma.product.delete({ where: { id: product.id } }).catch(() => undefined);
    await prisma.category.delete({ where: { id: created.data.id } }).catch(() => undefined);
  }
});
