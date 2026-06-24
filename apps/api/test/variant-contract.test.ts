import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../../..");

test("variant contract removes deprecated source and cost fields across schema and admin surfaces", () => {
  const schema = readFileSync(resolve(repoRoot, "packages/db/prisma/schema.prisma"), "utf8");
  const removeVariantMigration = readFileSync(
    resolve(
      repoRoot,
      "packages/db/prisma/migrations/20260625100000_remove_variant_cost_and_default_source/migration.sql",
    ),
    "utf8",
  );
  const variantsController = readFileSync(
    resolve(repoRoot, "apps/api/src/admin/catalog/admin-variants.controller.ts"),
    "utf8",
  );
  const variantFormFields = readFileSync(
    resolve(repoRoot, "apps/admin/src/features/variants/VariantFormFields.tsx"),
    "utf8",
  );
  const seed = readFileSync(resolve(repoRoot, "packages/db/prisma/seed.ts"), "utf8");
  const integrity = readFileSync(
    resolve(repoRoot, "apps/api/src/admin/integrity/admin-integrity.service.ts"),
    "utf8",
  );
  const addDiscountMigration = readFileSync(
    resolve(
      repoRoot,
      "packages/db/prisma/migrations/20260625113000_add_variant_discount_percent/migration.sql",
    ),
    "utf8",
  );

  for (const source of [variantsController, variantFormFields, seed, integrity]) {
    assert.equal(source.includes("costEstimate"), false);
    assert.equal(source.includes("defaultSourceId"), false);
  }

  assert.match(schema, /discountPercent\s+Int\?/);
  assert.match(variantsController, /"discountPercent"/);
  assert.match(variantFormFields, /discountPercent/);
  assert.match(addDiscountMigration, /ADD COLUMN IF NOT EXISTS "discountPercent" INTEGER/);
  assert.match(removeVariantMigration, /DROP COLUMN IF EXISTS "costEstimate"/);
  assert.match(removeVariantMigration, /DROP COLUMN IF EXISTS "defaultSourceId"/);
});
