ALTER TABLE "product_variants"
DROP CONSTRAINT IF EXISTS "product_variants_defaultSourceId_fkey";

ALTER TABLE "product_variants"
DROP COLUMN IF EXISTS "costEstimate",
DROP COLUMN IF EXISTS "defaultSourceId";
