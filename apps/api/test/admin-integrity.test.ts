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
  const variant = await prisma.productVariant.findFirstOrThrow({
    select: { id: true },
  });

  const source = await prisma.supplySource.create({
    data: {
      name: `Delete Blocked Source ${Date.now()}`,
      slug: `delete-blocked-source-${Date.now()}`,
    },
    select: { id: true },
  });

  const account = await prisma.inventoryAccount.create({
    data: {
      productVariantId: variant.id,
      sourceId: source.id,
      username: `blocked-${Date.now()}`,
      passwordEncrypted: "encrypted",
    },
    select: { id: true },
  });

  const integrity = new AdminIntegrityService(prisma as any);
  const controller = new AdminSourcesController(prisma as any, {} as any);

  try {
    const preflight = await integrity.getSupplySourceDeletePreflight(source.id);

    assert.equal(preflight.canDelete, false);
    assert.deepEqual(preflight.blockingDependencies, [
      {
        resource: "inventory_accounts",
        count: 1,
        sampleIds: [account.id],
      },
    ]);

    await assert.rejects(
      () => controller.remove(source.id),
      (error: unknown) => error instanceof ConflictException,
    );
  } finally {
    await prisma.inventoryAccount.delete({ where: { id: account.id } }).catch(() => {});
    await prisma.supplySource.delete({ where: { id: source.id } }).catch(() => {});
  }
});
