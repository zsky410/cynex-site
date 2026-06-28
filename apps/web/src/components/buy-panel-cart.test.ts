import test from "node:test";
import assert from "node:assert/strict";
import { validateCustomerInput } from "./buy-panel-customer-input";

test("add-to-cart flow still requires configured customer input", () => {
  assert.equal(
    validateCustomerInput([{ name: "email", label: "Email", required: true, type: "email" }], {}),
    "Vui lòng nhập Email",
  );
});
