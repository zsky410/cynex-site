-- Move any legacy banner image into the primary product image slot before cleanup
UPDATE "products"
SET "imageFileId" = COALESCE("imageFileId", "bannerFileId")
WHERE "bannerFileId" IS NOT NULL;

-- Remove the redundant product banner field
ALTER TABLE "products"
DROP COLUMN "bannerFileId";
