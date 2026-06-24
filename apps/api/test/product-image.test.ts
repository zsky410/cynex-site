import { after, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@cynex/db";
import { AdminProductsController } from "../src/admin/catalog/admin-products.controller";
import { CatalogService } from "../src/catalog/catalog.service";
import { FilesService } from "../src/files/files.service";

const prisma = new PrismaClient();

after(async () => {
  await prisma.$disconnect();
});

test("admin product endpoints serialize a single image field without banner", async () => {
  const now = Date.now();
  const admin = await prisma.admin.findFirstOrThrow({ select: { id: true } });
  const category = await prisma.category.create({
    data: {
      name: `Product Image Category ${now}`,
      slug: `product-image-category-${now}`,
    },
  });
  const file = await prisma.fileObject.create({
    data: {
      fileName: `product-image-${now}.png`,
      mimeType: "image/png",
      size: 2048,
      storageDriver: "r2",
      storageKey: `tests/product-image-${now}.png`,
      publicUrl: `https://cdn.test/product-image-${now}.png`,
      uploadedByAdminId: admin.id,
    },
  });

  const controller = new AdminProductsController(
    prisma as any,
    { logAdminAction: async () => undefined } as any,
    new FilesService(prisma as any),
    { getProductDeletePreflight: async () => ({ canDelete: true, blockingDependencies: [] }) } as any,
  );

  let productId: string | null = null;

  try {
    const created = await controller.create(
      { id: admin.id } as any,
      {
        categoryId: category.id,
        name: `Single Image ${now}`,
        slug: `single-image-${now}`,
        shortDescription: "Only one image field",
        status: "active",
        imageFileId: file.id,
      },
    );
    productId = created.data.id;

    assert.equal(created.data.image?.id, file.id);
    assert.equal("banner" in created.data, false);

    const fetched = await controller.getOne(productId);
    assert.equal(fetched.data.image?.id, file.id);
    assert.equal("banner" in fetched.data, false);

    const listed = await controller.list({});
    const row = listed.data.find((item) => item.id === productId);
    assert.ok(row);
    assert.equal(row.image?.id, file.id);
    assert.equal("banner" in row, false);
  } finally {
    if (productId) {
      await prisma.product.delete({ where: { id: productId } }).catch(() => undefined);
    }
    await prisma.fileObject.delete({ where: { id: file.id } }).catch(() => undefined);
    await prisma.category.delete({ where: { id: category.id } }).catch(() => undefined);
  }
});

test("public catalog product responses expose one image field without banner", async () => {
  const now = Date.now();
  const admin = await prisma.admin.findFirstOrThrow({ select: { id: true } });
  const category = await prisma.category.create({
    data: {
      name: `Catalog Image Category ${now}`,
      slug: `catalog-image-category-${now}`,
    },
  });
  const file = await prisma.fileObject.create({
    data: {
      fileName: `catalog-image-${now}.png`,
      mimeType: "image/png",
      size: 1024,
      storageDriver: "r2",
      storageKey: `tests/catalog-image-${now}.png`,
      publicUrl: `https://cdn.test/catalog-image-${now}.png`,
      uploadedByAdminId: admin.id,
    },
  });
  const product = await prisma.product.create({
    data: {
      categoryId: category.id,
      name: `Catalog Product ${now}`,
      slug: `catalog-product-${now}`,
      shortDescription: "Single public image",
      status: "active",
      imageFileId: file.id,
    },
  });
  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      name: `Catalog Variant ${now}`,
      slug: `catalog-variant-${now}`,
      price: 99000,
      fulfillmentType: "LICENSE_KEY",
      status: "active",
    },
  });

  const service = new CatalogService(prisma as any, new FilesService(prisma as any));

  try {
    const detail = await service.getProduct(product.slug);
    assert.equal(detail.image?.id, file.id);
    assert.equal("banner" in detail, false);

    const list = await service.listProducts();
    const row = list.find((item) => item.id === product.id);
    assert.ok(row);
    assert.equal(row.image?.id, file.id);
    assert.equal("banner" in row, false);
  } finally {
    await prisma.productVariant.delete({ where: { id: variant.id } }).catch(() => undefined);
    await prisma.product.delete({ where: { id: product.id } }).catch(() => undefined);
    await prisma.fileObject.delete({ where: { id: file.id } }).catch(() => undefined);
    await prisma.category.delete({ where: { id: category.id } }).catch(() => undefined);
  }
});
