"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const CART_STORAGE_KEY = "cynex_session_cart";

export type CartItem = {
  productSlug: string;
  productName: string;
  productVariantId: string;
  variantName: string;
  price: number;
  customerInput?: Record<string, unknown>;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (productVariantId: string) => void;
  removeItems: (productVariantIds: string[]) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isCartItem(value: unknown): value is CartItem {
  if (!isRecord(value)) return false;
  return (
    typeof value.productSlug === "string" &&
    typeof value.productName === "string" &&
    typeof value.productVariantId === "string" &&
    typeof value.variantName === "string" &&
    typeof value.price === "number"
  );
}

export function readCartItems(raw: string | null | undefined): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isCartItem);
  } catch {
    return [];
  }
}

export function upsertCartItem(items: CartItem[], item: CartItem): CartItem[] {
  return [...items.filter((entry) => entry.productVariantId !== item.productVariantId), item];
}

export function removeCartItemByVariantId(items: CartItem[], productVariantId: string): CartItem[] {
  return items.filter((entry) => entry.productVariantId !== productVariantId);
}

export function removeCartItemsByVariantIds(items: CartItem[], productVariantIds: string[]): CartItem[] {
  const idSet = new Set(productVariantIds);
  return items.filter((entry) => !idSet.has(entry.productVariantId));
}

export function getCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const next = readCartItems(sessionStorage.getItem(CART_STORAGE_KEY));
    setItems(next);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Keep in-memory cart usable even if browser storage is unavailable.
    }
  }, [hydrated, items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.length,
      total: getCartTotal(items),
      addItem: (item) => setItems((current) => upsertCartItem(current, item)),
      removeItem: (productVariantId) =>
        setItems((current) => removeCartItemByVariantId(current, productVariantId)),
      removeItems: (productVariantIds) =>
        setItems((current) => removeCartItemsByVariantIds(current, productVariantIds)),
      clearCart: () => setItems([]),
    }),
    [items],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
