import type { CartItem } from "./cart-store";

export type CartCheckoutResult = {
  created: Array<{ item: CartItem; orderCode: string }>;
  failed: CartItem[];
};

export async function convertCartItemsToOrders(
  items: CartItem[],
  createOrder: (item: CartItem) => Promise<{ orderCode: string }>,
): Promise<CartCheckoutResult> {
  const created: CartCheckoutResult["created"] = [];
  const failed: CartCheckoutResult["failed"] = [];

  for (const item of items) {
    try {
      const order = await createOrder(item);
      created.push({ item, orderCode: order.orderCode });
    } catch {
      failed.push(item);
    }
  }

  return { created, failed };
}
