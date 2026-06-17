"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, getToken, ApiError } from "@/lib/api";
import { formatVnd } from "@/lib/utils";

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

export function BuyPanel({ variants }: { variants: Variant[] }) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState(variants[0]?.id ?? "");
  const [input, setInput] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const selected = variants.find((v) => v.id === selectedId);
  if (!selected) return <p className="text-slate-500">Chưa có gói bán.</p>;

  async function buy() {
    setError(null);
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

  return (
    <div className="rounded-xl border bg-white p-5">
      <div className="space-y-2">
        {variants.map((v) => (
          <label
            key={v.id}
            className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 ${
              v.id === selectedId ? "border-brand ring-1 ring-brand" : ""
            }`}
          >
            <span className="flex items-center gap-2">
              <input
                type="radio"
                name="variant"
                checked={v.id === selectedId}
                onChange={() => setSelectedId(v.id)}
                disabled={v.status === "out_of_stock"}
              />
              <span>
                <span className="font-medium">{v.name}</span>
                <span className="block text-xs text-slate-500">
                  {FULFILLMENT_LABEL[v.fulfillmentType] ?? v.fulfillmentType}
                  {v.warrantyDays ? ` · BH ${v.warrantyDays} ngày` : ""}
                  {v.estimatedDeliveryMinutes ? ` · xử lý ~${v.estimatedDeliveryMinutes} phút` : ""}
                </span>
              </span>
            </span>
            <span className="font-bold text-brand">{formatVnd(v.price)}</span>
          </label>
        ))}
      </div>

      {selected.requiresCustomerInput && (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-medium">Thông tin cần cung cấp</p>
          {(selected.customerInputSchema?.fields ?? []).map((f) => (
            <div key={f.name}>
              <label className="text-xs text-slate-500">{f.label}</label>
              <input
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                type={f.type === "email" ? "email" : "text"}
                value={input[f.name] ?? ""}
                onChange={(e) => setInput({ ...input, [f.name]: e.target.value })}
              />
            </div>
          ))}
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <button
        onClick={buy}
        disabled={loading || selected.status === "out_of_stock"}
        className="mt-4 w-full rounded-lg bg-brand py-2.5 font-medium text-white disabled:opacity-50"
      >
        {selected.status === "out_of_stock" ? "Tạm hết hàng" : loading ? "Đang xử lý..." : "Mua ngay"}
      </button>
    </div>
  );
}
