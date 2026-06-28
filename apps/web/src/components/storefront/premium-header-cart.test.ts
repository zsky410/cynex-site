import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("PremiumHeader includes cart entry point", () => {
  const file = fs.readFileSync(path.resolve("src/components/storefront/PremiumChrome.tsx"), "utf8");
  assert.match(file, /href=\"\/cart\"/);
  assert.match(file, /ShoppingCart/);
  assert.doesNotMatch(file, /rounded-xl border border-slate-200 bg-white px-3 py-2/);
});

test("PremiumHeader uses color-only active nav and profile dropdown account actions", () => {
  const file = fs.readFileSync(path.resolve("src/components/storefront/PremiumChrome.tsx"), "utf8");
  assert.doesNotMatch(file, /border-b-2 pb-1/);
  assert.match(file, /setProfileOpen/);
  assert.match(file, /href=\"\/orders\"/);
  assert.match(file, /href=\"\/wallet\"/);
  assert.match(file, /Đăng xuất/);
});
