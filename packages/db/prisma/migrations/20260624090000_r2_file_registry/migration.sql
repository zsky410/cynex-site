-- AlterTable
ALTER TABLE "products"
ADD COLUMN "bannerFileId" TEXT,
ADD COLUMN "guideFileIds" JSONB;

-- AlterTable
ALTER TABLE "source_orders"
ADD COLUMN "proofFileIds" JSONB;

-- Data migration from legacy singular proof file field
UPDATE "source_orders"
SET "proofFileIds" = jsonb_build_array("proofFileId")
WHERE "proofFileId" IS NOT NULL;

-- Drop old singular field
ALTER TABLE "source_orders"
DROP COLUMN "proofFileId";
