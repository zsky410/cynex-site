import { test } from "node:test";
import assert from "node:assert/strict";
import { PaymentMethod, PaymentProvider } from "@cynex/shared";

test("shared payment enums expose sepay values", () => {
  assert.equal(PaymentProvider.sepay, "sepay");
  assert.equal(PaymentMethod.sepay, "sepay");
});
