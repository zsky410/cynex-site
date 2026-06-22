"use client";

import { useRouter } from "next/navigation";
import { ShoppingCart, ShieldCheck, Star, WalletCards } from "lucide-react";
import { useMemo, useState } from "react";
import { apiFetch, getToken, ApiError } from "@/lib/api";
import { cn, formatVnd } from "@/lib/utils";

interface Field {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}

export interface Variant {
  id: string;
  name: string;
  price: number;
  durationDays?: number | null;
  fulfillmentType: string;
  warrantyDays: number;
  estimatedDeliveryMinutes?: number | null;
  requiresCustomerInput: boolean;
  customerInputSchema?: { fields?: Field[] } | null;
  status: string;
}

const FULFILLMENT_LABEL: Record<string, string> = {
  CUSTOMER_ACCOUNT_UPGRADE: "Nâng cấp chính chủ",
  DEDICATED_ACCOUNT: "Tài khoản riêng",
  SHARED_ACCOUNT: "Tài khoản dùng chung",
  LICENSE_KEY: "Key/License",
  MANUAL_DELIVERY: "Giao thủ công",
};

function deriveDurationLabel(variant: Variant): string {
  if (variant.durationDays) {
    if (variant.durationDays >= 360) return `${Math.round(variant.durationDays / 30)} Tháng`;
    if (variant.durationDays >= 30) return `${Math.round(variant.durationDays / 30)} Tháng`;
    return `${variant.durationDays} Ngày`;
  }

  const match = variant.name.match(/(\d+)\s*(tháng|năm|ngày)/i);
  if (match) {
    return `${match[1]} ${match[2][0].toUpperCase()}${match[2].slice(1).toLowerCase()}`;
  }

  if (variant.name.toLowerCase().includes("vĩnh viễn")) return "Vĩnh viễn";
  return variant.name;
}

function inferReferencePrice(price: number): number {
  return Math.round(price * 2.82 / 1000) * 1000;
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

  async function buy() {
    setError(null);
    setCartNotice(null);
    if (!getToken()) {
      router.push("/login?next=" + encodeURIComponent(window.location.pathname));
      return;
    }
    setLoading(true);
    try {
      const order = await apiFetch<{ orderCode: string }>("/orders", {
        method: "POST",
        body: JSON.stringify({
          productVariantId: selected!.id,
          customerInput: selected!.requiresCustomerInput ? input : undefined,
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
      <div className="mb-6 flex items-center gap-4 text-sm text-slate-500">
        <span className="inline-flex items-center gap-1.5 text-amber-400">
          <Star className="h-4 w-4 fill-current" />
          <span className="font-semibold text-slate-800">4.9</span>
          <span>(128 đánh giá)</span>
        </span>
        <span className="text-slate-300">•</span>
        <span className="inline-flex items-center gap-2 text-sky-600">
          <ShieldCheck className="h-4 w-4" />
          Bảo hành trọn thời gian
        </span>
      </div>

      <div className="border-t border-slate-200 pt-7">
        <h2 className="text-lg font-semibold text-slate-900">Chọn gói thời gian</h2>
      </div>

      <div className="mt-5 space-y-3">
        {orderedVariants.map((v, index) => {
          const selectedVariant = v.id === selectedId;
          const soldOut = v.status === "out_of_stock";
          const durationLabel = deriveDurationLabel(v);
          const oldPrice = inferReferencePrice(v.price);
          return (
          <label
            key={v.id}
            className={cn(
              "block cursor-pointer rounded-[18px] border px-4 py-4 transition",
              selectedVariant
                ? "border-sky-500 bg-[#eef5ff] text-slate-900 shadow-[0_0_0_1px_rgba(14,165,233,0.25)]"
                : "border-slate-200 bg-white text-slate-900 hover:border-sky-200",
              soldOut && "opacity-75",
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <span className="flex items-start gap-3">
                <span
                  className={cn(
                    "mt-1 flex h-7 w-7 items-center justify-center rounded-full border-2",
                    selectedVariant ? "border-sky-600" : "border-slate-300",
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
                    className="h-3.5 w-3.5 accent-sky-600"
                  />
                </span>
                <span>
                  <span className="block text-[18px] font-medium tracking-[-0.03em]">{durationLabel}</span>
                  <span className="mt-1 block text-xs text-slate-500">
                    {FULFILLMENT_LABEL[v.fulfillmentType] ?? v.fulfillmentType}
                    {v.estimatedDeliveryMinutes ? ` · xử lý ~${v.estimatedDeliveryMinutes} phút` : ""}
                  </span>
                  {selectedVariant && index === 0 ? (
                    <span className="mt-2 inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
                      Tiết kiệm nhất
                    </span>
                  ) : null}
                  {soldOut ? <span className="mt-2 block text-xs text-red-500">Hết hàng</span> : null}
                </span>
              </span>

              <span className="text-right">
                <span className="block text-[18px] font-semibold text-sky-700">{formatVnd(v.price)}</span>
                <span className="block text-sm text-slate-400 line-through">{formatVnd(oldPrice)}</span>
              </span>
            </div>
          </label>
        )})}
      </div>

      {selected.requiresCustomerInput && (
        <div className="mt-5 rounded-[20px] border border-slate-200 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          <p className="text-sm font-medium text-slate-900">Thông tin cần cung cấp</p>
          {(selected.customerInputSchema?.fields ?? []).map((f) => (
            <div key={f.name} className="mt-3">
              <label className="text-xs text-slate-500">{f.label}</label>
              <input
                className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-300"
                type={f.type === "email" ? "email" : "text"}
                value={input[f.name] ?? ""}
                onChange={(e) => setInput({ ...input, [f.name]: e.target.value })}
              />
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {cartNotice && <p className="mt-4 text-sm text-sky-700">{cartNotice}</p>}

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <button
          onClick={buy}
          disabled={loading || selected.status === "out_of_stock"}
          className="inline-flex items-center justify-center gap-3 rounded-[18px] bg-[#2faee7] px-6 py-4 text-lg font-semibold text-white shadow-[0_10px_0_rgba(11,46,91,0.18)] transition hover:bg-[#249fd7] disabled:opacity-50"
        >
          <WalletCards className="h-5 w-5" />
          {selected.status === "out_of_stock" ? "Tạm hết hàng" : loading ? "Đang xử lý..." : "Mua ngay"}
        </button>

        <button
          type="button"
          onClick={addToCart}
          disabled={selected.status === "out_of_stock"}
          className="inline-flex items-center justify-center gap-3 rounded-[18px] border border-sky-600 bg-white px-6 py-4 text-lg font-semibold text-sky-700 transition hover:bg-sky-50 disabled:opacity-50"
        >
          <ShoppingCart className="h-5 w-5" />
          Thêm vào giỏ hàng
        </button>
      </div>
    </div>
  );
}
