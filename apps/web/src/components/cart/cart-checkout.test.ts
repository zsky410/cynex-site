import test from "node:test";
import assert from "node:assert/strict";
import { convertCartItemsToOrders } from "./cart-checkout";
import type { CartItem } from "./cart-store";

const items: CartItem[] = [
  {
    productSlug: "chatgpt",
    productName: "ChatGPT",
    productVariantId: "v1",
    variantName: "1 tháng",
    price: 80000,
  },
  {
    productSlug: "drive",
    productName: "Drive",
    productVariantId: "v2",
    variantName: "1 năm",
    price: 199000,
  },
];

test("convertCartItemsToOrders keeps successful and failed items separate", async () => {
  const result = await convertCartItemsToOrders(items, async (item) => {
    if (item.productVariantId === "v2") {
      throw new Error("fail");
    }
    return { orderCode: "CY001" };
  });

  assert.deepEqual(result.created, [{ item: items[0], orderCode: "CY001" }]);
  assert.deepEqual(result.failed, [items[1]]);
});
