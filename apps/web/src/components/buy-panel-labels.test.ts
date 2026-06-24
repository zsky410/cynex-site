import test from "node:test";
import assert from "node:assert/strict";
import { getVariantPrimaryLabel, getVariantSecondaryLabel } from "./buy-panel-labels";

test("variant primary label keeps the real variant name", () => {
  assert.equal(
    getVariantPrimaryLabel({
      id: "v1",
      name: "5TB Luu tru",
      price: 449000,
      durationDays: 360,
      fulfillmentType: "CUSTOMER_ACCOUNT_UPGRADE",
      warrantyDays: 30,
      requiresCustomerInput: false,
      status: "active",
    }),
    "5TB Luu tru",
  );
});

test("variant secondary label can derive a duration hint when available", () => {
  assert.equal(
    getVariantSecondaryLabel({
      id: "v1",
      name: "5TB Luu tru",
      price: 449000,
      durationDays: 360,
      fulfillmentType: "CUSTOMER_ACCOUNT_UPGRADE",
      warrantyDays: 30,
      requiresCustomerInput: false,
      status: "active",
    }),
    "12 Tháng",
  );
});
