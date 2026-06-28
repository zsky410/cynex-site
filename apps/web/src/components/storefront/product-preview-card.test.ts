import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("ProductPreviewCard source removes category chip and description copy", () => {
  const file = fs.readFileSync(path.resolve("src/components/storefront/ProductPreviewCard.tsx"), "utf8");
  assert.doesNotMatch(file, /presentation\.chipClass/);
  assert.doesNotMatch(file, /product\.shortDescription \?\?/);
  assert.match(file, /aspect-\[1268\/636\]/);
  assert.match(file, /rounded-\[8px\]/);
  assert.doesNotMatch(file, /min-h-10/);
  assert.doesNotMatch(file, /border border-slate-200 bg-white/);
  assert.match(file, /text-\[16px\] font-normal/);
  assert.match(file, /Xem chi tiết/);
  assert.doesNotMatch(file, /Giá từ/);
  assert.doesNotMatch(file, /cadence/);
});

test("storefront product grids use four-column desktop layout", () => {
  const featured = fs.readFileSync(path.resolve("src/components/storefront/FeaturedProducts.tsx"), "utf8");
  const catalog = fs.readFileSync(path.resolve("src/components/storefront/ProductsCatalog.tsx"), "utf8");
  assert.match(featured, /lg:grid-cols-3/);
  assert.match(featured, /2xl:grid-cols-4/);
  assert.match(catalog, /lg:grid-cols-3/);
  assert.match(catalog, /2xl:grid-cols-4/);
});
