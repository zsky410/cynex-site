import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

test("checkout pages reference shared premium chrome", () => {
  const checkout = fs.readFileSync(path.resolve("src/app/checkout/[orderCode]/page.tsx"), "utf8");
  const payment = fs.readFileSync(path.resolve("src/app/checkout/[orderCode]/payment/page.tsx"), "utf8");
  assert.match(checkout, /PremiumFooter/);
  assert.match(checkout, /PremiumHeader/);
  assert.match(payment, /PremiumFooter/);
  assert.match(payment, /PremiumHeader/);
  assert.doesNotMatch(checkout, /CYNEX/);
  assert.doesNotMatch(payment, /CYNEX/);
});

test("payment page uses focused transfer section without step breadcrumb", () => {
  const paymentPage = fs.readFileSync(path.resolve("src/app/checkout/[orderCode]/payment/page.tsx"), "utf8");
  const bankTransfer = fs.readFileSync(path.resolve("src/components/payments/BankTransferInstructions.tsx"), "utf8");

  assert.doesNotMatch(paymentPage, /Cart <span/);
  assert.doesNotMatch(paymentPage, /Thanh toán chuyển khoản/);
  assert.doesNotMatch(bankTransfer, /Mã mới/);
  assert.match(bankTransfer, /lg:grid-cols-\[minmax\(280px,0\.92fr\)_minmax\(320px,1\.08fr\)\]/);
  assert.match(bankTransfer, /expiresAt/);
});
