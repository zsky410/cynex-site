import test from "node:test";
import assert from "node:assert/strict";
import {
  getConfiguredCustomerFields,
  validateCustomerInput,
} from "./buy-panel-customer-input";

test("buy panel customer input keeps valid configured fields", () => {
  assert.deepEqual(
    getConfiguredCustomerFields({
      fields: [
        { name: "account_email", label: "Email tai khoan", required: true },
        { name: "", label: "Ignored" },
      ],
    }),
    [{ name: "account_email", label: "Email tai khoan", required: true }],
  );
});

test("buy panel customer input validates required fields", () => {
  assert.equal(
    validateCustomerInput([{ name: "account_email", label: "Email tai khoan", required: true }], {}),
    "Vui lòng nhập Email tai khoan",
  );
});
