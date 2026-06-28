import { after, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@cynex/db";
import { CatalogService } from "../src/catalog/catalog.service";
import { FilesService } from "../src/files/files.service";

const prisma = new PrismaClient();

after(async () => {
  await prisma.$disconnect();
});

test("public categories only include categories attached to active products", async () => {
  const now = Date.now();

  const visibleCategory = await prisma.category.create({
    data: {
      name: `Visible Category ${now}`,
      slug: `visible-category-${now}`,
      sortOrder: 1,
    },
    select: { id: true, slug: true },
  });

  const hiddenCategory = await prisma.category.create({
    data: {
      name: `Hidden Category ${now}`,
      slug: `hidden-category-${now}`,
      sortOrder: 2,
    },
    select: { id: true, slug: true },
  });

  const inactiveCategory = await prisma.category.create({
    data: {
      name: `Inactive Category ${now}`,
      slug: `inactive-category-${now}`,
      sortOrder: 3,
    },
    select: { id: true, slug: true },
  });

  const activeProduct = await prisma.product.create({
    data: {
      categoryId: visibleCategory.id,
      name: `Visible Product ${now}`,
      slug: `visible-product-${now}`,
      status: "active",
    },
    select: { id: true },
  });

  const inactiveProduct = await prisma.product.create({
    data: {
      categoryId: inactiveCategory.id,
      name: `Inactive Product ${now}`,
      slug: `inactive-product-${now}`,
      status: "inactive",
    },
    select: { id: true },
  });

  const service = new CatalogService(prisma as any, new FilesService(prisma as any));

  try {
    const categories = await service.listCategories();
    const slugs = categories.map((category) => category.slug);

    assert.deepEqual(slugs.includes(visibleCategory.slug), true);
    assert.deepEqual(slugs.includes(hiddenCategory.slug), false);
    assert.deepEqual(slugs.includes(inactiveCategory.slug), false);
  } finally {
    await prisma.product.delete({ where: { id: activeProduct.id } }).catch(() => undefined);
    await prisma.product.delete({ where: { id: inactiveProduct.id } }).catch(() => undefined);
    await prisma.category.delete({ where: { id: visibleCategory.id } }).catch(() => undefined);
    await prisma.category.delete({ where: { id: hiddenCategory.id } }).catch(() => undefined);
    await prisma.category.delete({ where: { id: inactiveCategory.id } }).catch(() => undefined);
  }
});
