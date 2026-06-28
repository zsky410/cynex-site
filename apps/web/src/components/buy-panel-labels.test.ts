import test from "node:test";
import assert from "node:assert/strict";
import {
  getVariantFulfillmentBadgeClassName,
  getVariantFulfillmentBadgeLabel,
  getVariantPrimaryLabel,
  getVariantSecondaryLabel,
  getVariantStorefrontOptionLabel,
} from "./buy-panel-labels";

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

test("variant can expose a storefront fulfillment badge label", () => {
  assert.equal(
    getVariantFulfillmentBadgeLabel({
      id: "v1",
      name: "1 Thang",
      price: 99000,
      durationDays: 30,
      fulfillmentType: "DEDICATED_ACCOUNT",
      warrantyDays: 30,
      requiresCustomerInput: false,
      status: "active",
    }),
    "Tài khoản riêng",
  );
});

test("variant storefront option label combines admin name and duration", () => {
  assert.equal(
    getVariantStorefrontOptionLabel({
      id: "v1",
      name: "GPT Plus - Cấp tài khoản",
      price: 80000,
      durationDays: 30,
      fulfillmentType: "DEDICATED_ACCOUNT",
      warrantyDays: 30,
      requiresCustomerInput: false,
      status: "active",
    }),
    "GPT Plus - Cấp tài khoản - 1 Tháng",
  );
});

test("variant storefront option label avoids duplicate duration text", () => {
  assert.equal(
    getVariantStorefrontOptionLabel({
      id: "v1",
      name: "Gói 1 Tháng",
      price: 80000,
      durationDays: 30,
      fulfillmentType: "DEDICATED_ACCOUNT",
      warrantyDays: 30,
      requiresCustomerInput: false,
      status: "active",
    }),
    "Gói 1 Tháng",
  );
});

test("manual delivery keeps a safe fallback badge label", () => {
  assert.equal(
    getVariantFulfillmentBadgeLabel({
      id: "v1",
      name: "1 Thang",
      price: 99000,
      durationDays: 30,
      fulfillmentType: "MANUAL_DELIVERY",
      warrantyDays: 30,
      requiresCustomerInput: false,
      status: "active",
    }),
    "Khác",
  );
});

test("selected variant badge keeps contrast against the selected card", () => {
  assert.match(
    getVariantFulfillmentBadgeClassName(true),
    /bg-white\/10/,
  );
  assert.match(
    getVariantFulfillmentBadgeClassName(true),
    /text-white/,
  );
  assert.match(
    getVariantFulfillmentBadgeClassName(true),
    /ring-white\/55/,
  );
});
