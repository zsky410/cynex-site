"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import { apiFetch, getToken, ApiError } from "@/lib/api";
import { cn, formatVnd } from "@/lib/utils";
import {
  getConfiguredCustomerFields,
  validateCustomerInput,
  type CustomerInputField,
} from "./buy-panel-customer-input";

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
}: {
  variants: Variant[];
  productName: string;
}) {
  const router = useRouter();
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

  const selected = orderedVariants.find((v) => v.id === selectedId);
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
    try {
      const current = JSON.parse(localStorage.getItem("cynex_cart") ?? "[]") as Array<{
        productName: string;
        productVariantId: string;
        variantName: string;
        price: number;
      }>;

      const next = [
        ...current.filter((item) => item.productVariantId !== activeVariant.id),
        {
          productName,
          productVariantId: activeVariant.id,
          variantName: activeVariant.name,
          price: activeVariant.price,
        },
      ];
      localStorage.setItem("cynex_cart", JSON.stringify(next));
      setCartNotice("Đã thêm gói đã chọn vào giỏ tạm.");
    } catch {
      setCartNotice("Không thể lưu vào giỏ tạm lúc này.");
    }
  }

  return (
    <div>
      <div className="border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-end gap-x-3 gap-y-2">
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
        <h2 className="text-[15px] font-semibold text-slate-900">Thời gian sử dụng</h2>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-2">
        {orderedVariants.map((v) => {
          const selectedVariant = v.id === selectedId;
          const soldOut = v.status === "out_of_stock";
          return (
            <label
              key={v.id}
              className={cn(
                "inline-flex cursor-pointer rounded-xl border px-3.5 py-2 text-[14px] font-medium leading-none transition sm:px-4 sm:py-2.5 sm:text-[15px]",
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
              <span>{v.name}</span>
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
      {cartNotice && <p className="mt-2.5 text-sm text-sky-700">{cartNotice}</p>}

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        <button
          onClick={buy}
          disabled={loading || selected.status === "out_of_stock"}
          className="inline-flex items-center justify-center gap-2.5 rounded-[18px] bg-[linear-gradient(180deg,#49a3ff_0%,#2563eb_100%)] px-5 py-3 text-base font-semibold text-white shadow-[0_10px_0_rgba(29,78,216,0.16),0_14px_26px_rgba(59,130,246,0.24)] transition hover:translate-y-0.5 hover:shadow-[0_8px_0_rgba(29,78,216,0.16),0_12px_22px_rgba(59,130,246,0.2)] disabled:translate-y-0 disabled:opacity-50"
        >
          <WalletCards className="h-4.5 w-4.5" />
          {selected.status === "out_of_stock" ? "Tạm hết hàng" : loading ? "Đang xử lý..." : "Mua ngay"}
        </button>

        <button
          type="button"
          onClick={addToCart}
          disabled={selected.status === "out_of_stock"}
          className="inline-flex items-center justify-center gap-2.5 rounded-[18px] border-2 border-[#60a5fa] bg-white px-5 py-3 text-base font-semibold text-[#2563eb] transition hover:border-[#3b82f6] hover:bg-sky-50/40 disabled:opacity-50"
        >
          <ShoppingCart className="h-4.5 w-4.5" />
          Thêm vào giỏ hàng
        </button>
      </div>
    </div>
  );
}
