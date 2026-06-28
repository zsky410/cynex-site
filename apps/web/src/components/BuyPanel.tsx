"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart, WalletCards } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { apiFetch, getToken, ApiError } from "@/lib/api";
import { useCart } from "@/components/cart/cart-store";
import { cn, formatVnd } from "@/lib/utils";
import {
  getConfiguredCustomerFields,
  validateCustomerInput,
  type CustomerInputField,
} from "./buy-panel-customer-input";
import {
  getVariantFulfillmentBadgeLabel,
  getVariantStorefrontOptionLabel,
} from "./buy-panel-labels";

export interface Variant {
  id: string;
  name: string;
  price: number;
  discountPercent?: number | null;
  durationDays?: number | null;
  fulfillmentType: string;
  warrantyDays: number;
  estimatedDeliveryMinutes?: number | null;
  requiresCustomerInput: boolean;
  customerInputSchema?: { fields?: CustomerInputField[] } | null;
  status: string;
}

function deriveOriginalPrice(price: number, discountPercent?: number | null): number | null {
  if (!discountPercent || discountPercent <= 0 || discountPercent >= 100) return null;
  return Math.round(price / (1 - discountPercent / 100));
}

export function BuyPanel({
  variants,
  productName,
  productSlug,
}: {
  variants: Variant[];
  productName: string;
  productSlug: string;
}) {
  const router = useRouter();
  const { addItem } = useCart();
  const orderedVariants = useMemo(
    () =>
      [...variants].sort((a, b) => {
        const durationDelta = (b.durationDays ?? 0) - (a.durationDays ?? 0);
        if (durationDelta !== 0) return durationDelta;
        return b.price - a.price;
      }),
    [variants],
  );
  const [selectedId, setSelectedId] = useState(orderedVariants[0]?.id ?? "");
  const [input, setInput] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const [justAdded, setJustAdded] = useState(false);

  const fulfillmentOptions = useMemo(() => {
    const seen = new Set<string>();
    return orderedVariants.filter((variant) => {
      if (seen.has(variant.fulfillmentType)) return false;
      seen.add(variant.fulfillmentType);
      return true;
    });
  }, [orderedVariants]);
  const selectedFulfillmentType =
    orderedVariants.find((variant) => variant.id === selectedId)?.fulfillmentType ??
    fulfillmentOptions[0]?.fulfillmentType ??
    "";
  const variantsForFulfillment = orderedVariants.filter(
    (variant) => variant.fulfillmentType === selectedFulfillmentType,
  );

  const selected = orderedVariants.find((v) => v.id === selectedId) ?? variantsForFulfillment[0];
  if (!selected) return <p className="text-slate-400">Chưa có gói bán.</p>;
  const activeVariant = selected;
  const activeOldPrice = deriveOriginalPrice(activeVariant.price, activeVariant.discountPercent);
  const configuredCustomerFields = getConfiguredCustomerFields(activeVariant.customerInputSchema);

  async function buy() {
    setError(null);
    setCartNotice(null);
    if (!getToken()) {
      router.push("/login?next=" + encodeURIComponent(window.location.pathname));
      return;
    }
    if (activeVariant.requiresCustomerInput) {
      const validationError = validateCustomerInput(configuredCustomerFields, input);
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    setLoading(true);
    try {
      const order = await apiFetch<{ orderCode: string }>("/orders", {
        method: "POST",
        body: JSON.stringify({
          productVariantId: activeVariant.id,
          customerInput: activeVariant.requiresCustomerInput ? input : undefined,
        }),
      });
      router.push(`/checkout/${order.orderCode}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  function addToCart() {
    setError(null);
    if (activeVariant.requiresCustomerInput) {
      const validationError = validateCustomerInput(configuredCustomerFields, input);
      if (validationError) {
        setError(validationError);
        return;
      }
    }

    addItem({
      productSlug,
      productName,
      productVariantId: activeVariant.id,
      variantName: activeVariant.name,
      price: activeVariant.price,
      customerInput: activeVariant.requiresCustomerInput ? input : undefined,
    });
    setCartNotice("Đã thêm sản phẩm vào giỏ hàng.");
    setJustAdded(true);
  }

  useEffect(() => {
    if (!justAdded) return;
    const timer = window.setTimeout(() => setJustAdded(false), 1600);
    return () => window.clearTimeout(timer);
  }, [justAdded]);

  return (
    <div className="w-full min-w-0">
      <div className="min-h-[84px] border-b border-slate-200 pb-3">
        <div className="flex min-h-[68px] flex-wrap items-end gap-x-3 gap-y-2">
          <span className="text-[30px] font-semibold tracking-[-0.05em] text-slate-900 sm:text-[34px]">
            {formatVnd(activeVariant.price)}
          </span>
          {activeOldPrice ? (
            <>
              <span className="text-base text-slate-400 line-through sm:text-lg">
                {formatVnd(activeOldPrice)}
              </span>
              <span className="inline-flex rounded-md bg-red-500 px-2 py-1 text-xs font-semibold text-white">
                -{activeVariant.discountPercent}%
              </span>
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <h2 className="text-[15px] font-semibold text-slate-900">Hình thức</h2>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {fulfillmentOptions.map((v) => {
          const selectedFulfillment = v.fulfillmentType === selectedFulfillmentType;
          const groupVariants = orderedVariants.filter((variant) => variant.fulfillmentType === v.fulfillmentType);
          const soldOut = groupVariants.every((variant) => variant.status === "out_of_stock");
          return (
            <button
              type="button"
              key={v.fulfillmentType}
              onClick={() => {
                const firstVariant =
                  groupVariants.find((variant) => variant.status !== "out_of_stock") ?? groupVariants[0];
                if (!firstVariant) return;
                setSelectedId(firstVariant.id);
                setCartNotice(null);
              }}
              disabled={soldOut}
              className={cn(
                "inline-flex min-h-10 w-auto max-w-full cursor-pointer items-center whitespace-nowrap rounded-xl border px-3 py-2 text-left text-[13px] font-medium transition",
                selectedFulfillment
                  ? "border-[#3b82f6] bg-[#3b82f6] text-white shadow-[0_10px_24px_rgba(59,130,246,0.24)]"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400",
                soldOut && "opacity-75",
              )}
            >
              {getVariantFulfillmentBadgeLabel(v)}
            </button>
          );
        })}
      </div>

      <div className="mt-3">
        <h2 className="text-[15px] font-semibold text-slate-900">Biến thể</h2>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {variantsForFulfillment.map((v) => {
          const selectedVariant = v.id === selectedId;
          const soldOut = v.status === "out_of_stock";
          return (
            <label
              key={v.id}
              className={cn(
                "inline-flex min-h-10 w-auto max-w-full cursor-pointer items-center whitespace-nowrap rounded-xl border px-3 py-2 text-[13px] font-medium transition",
                selectedVariant
                  ? "border-[#3b82f6] bg-[#3b82f6] text-white shadow-[0_10px_24px_rgba(59,130,246,0.24)]"
                  : "border-slate-300 bg-white text-slate-700 hover:border-slate-400",
                soldOut && "opacity-75",
              )}
            >
              <input
                type="radio"
                name="variant"
                checked={selectedVariant}
                onChange={() => {
                  setSelectedId(v.id);
                  setCartNotice(null);
                }}
                disabled={soldOut}
                className="sr-only"
              />
              <span className="leading-none">{getVariantStorefrontOptionLabel(v)}</span>
            </label>
          );
        })}
      </div>

      {activeVariant.status === "out_of_stock" ? (
        <p className="mt-3 text-sm font-medium text-red-500">Gói đang chọn hiện đã hết hàng.</p>
      ) : null}

      {activeVariant.requiresCustomerInput && (
        <div className="mt-4 rounded-[18px] border border-slate-200/80 bg-white/60 p-3.5 backdrop-blur-[1px]">
          <p className="text-[15px] font-semibold text-slate-900">Thông tin cần cung cấp</p>
          {configuredCustomerFields.length ? configuredCustomerFields.map((f) => (
            <div key={f.name} className="mt-3">
              <label className="text-xs font-medium text-slate-500">
                {f.label}
                {f.required ? <span className="ml-1 text-red-500">*</span> : null}
              </label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white"
                type={f.type === "email" || f.type === "password" || f.type === "tel" ? f.type : "text"}
                placeholder={f.placeholder ?? `Nhập ${f.label.toLowerCase()}`}
                value={input[f.name] ?? ""}
                onChange={(e) => setInput({ ...input, [f.name]: e.target.value })}
              />
            </div>
          )) : (
            <p className="mt-3 text-sm text-amber-600">
              Gói này đang thiếu cấu hình thông tin cần nhập. Vui lòng liên hệ hỗ trợ.
            </p>
          )}
        </div>
      )}

      {error && <p className="mt-2.5 text-sm text-red-600">{error}</p>}
      <div className="mt-2.5 min-h-6">
        {cartNotice ? <p className="text-sm text-sky-700">{cartNotice}</p> : null}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <button
          onClick={buy}
          disabled={loading || selected.status === "out_of_stock"}
          className="inline-flex min-h-[52px] w-auto items-center justify-center gap-2.5 whitespace-nowrap rounded-[18px] bg-[linear-gradient(180deg,#49a3ff_0%,#2563eb_100%)] px-8 py-3 text-base font-semibold text-white shadow-[0_10px_0_rgba(29,78,216,0.16),0_14px_26px_rgba(59,130,246,0.24)] transition hover:translate-y-0.5 hover:shadow-[0_8px_0_rgba(29,78,216,0.16),0_12px_22px_rgba(59,130,246,0.2)] disabled:translate-y-0 disabled:opacity-50"
        >
          <WalletCards className="h-4.5 w-4.5" />
          {selected.status === "out_of_stock" ? "Tạm hết hàng" : loading ? "Đang xử lý..." : "Mua ngay"}
        </button>

        <button
          type="button"
          onClick={addToCart}
          disabled={selected.status === "out_of_stock"}
          className={cn(
            "inline-flex min-h-[52px] w-auto items-center justify-center gap-2.5 whitespace-nowrap rounded-[18px] border-2 px-8 py-3 text-base font-semibold transition duration-300 disabled:opacity-50",
            justAdded
              ? "scale-[1.03] animate-pulse border-emerald-400 bg-emerald-50 text-emerald-700 ring-4 ring-emerald-100 shadow-[0_12px_28px_rgba(16,185,129,0.18)]"
              : "border-[#60a5fa] bg-white text-[#2563eb] hover:-translate-y-0.5 hover:border-[#3b82f6] hover:bg-sky-50/40 hover:shadow-[0_10px_22px_rgba(59,130,246,0.12)]",
          )}
        >
          <ShoppingCart className="h-4.5 w-4.5" />
          <span className="whitespace-nowrap">{justAdded ? "Đã thêm vào giỏ" : "Thêm vào giỏ hàng"}</span>
        </button>
      </div>
    </div>
  );
}
