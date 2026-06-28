import test from "node:test";
import assert from "node:assert/strict";
import {
  getCartTotal,
  readCartItems,
  removeCartItemsByVariantIds,
  upsertCartItem,
  type CartItem,
} from "./cart-store";

const itemA: CartItem = {
  productSlug: "chatgpt",
  productName: "ChatGPT",
  productVariantId: "v1",
  variantName: "1 tháng",
  price: 80000,
};

const itemB: CartItem = {
  productSlug: "drive",
  productName: "Drive",
  productVariantId: "v2",
  variantName: "1 năm",
  price: 199000,
};

test("readCartItems ignores malformed payloads", () => {
  assert.deepEqual(readCartItems("not-json"), []);
  assert.deepEqual(readCartItems(JSON.stringify([{ foo: "bar" }])), []);
});

test("upsertCartItem deduplicates by variant id", () => {
  const items = upsertCartItem([itemA], { ...itemA, price: 90000 });
  assert.deepEqual(items, [{ ...itemA, price: 90000 }]);
});

test("removeCartItemsByVariantIds removes only requested items", () => {
  assert.deepEqual(removeCartItemsByVariantIds([itemA, itemB], ["v1"]), [itemB]);
});

test("getCartTotal sums all item prices", () => {
  assert.equal(getCartTotal([itemA, itemB]), 279000);
});
