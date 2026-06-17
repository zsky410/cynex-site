"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, ChevronRight, Clock3, ShieldCheck, Sparkles } from "lucide-react";
import { apiFetch, getToken, ApiError } from "@/lib/api";
import { VariantCard } from "@/components/catalog/variant-card";
import { FieldLabel, TextInput } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";
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
    <>
      <div className="space-y-3">
        {variants.map((v) => (
          <VariantCard
            key={v.id}
            title={v.name}
            subtitle={FULFILLMENT_LABEL[v.fulfillmentType] ?? v.fulfillmentType}
            price={v.price}
            warrantyDays={v.warrantyDays}
            estimatedDeliveryMinutes={v.estimatedDeliveryMinutes}
            selected={v.id === selectedId}
            disabled={v.status === "out_of_stock"}
            onSelect={() => setSelectedId(v.id)}
          />
        ))}
      </div>

      <Panel className="sticky top-24 mt-6 hidden lg:block">
        <BuySummary
          selected={selected}
          input={input}
          setInput={setInput}
          error={error}
          loading={loading}
          buy={buy}
        />
      </Panel>

      <div className="fixed inset-x-4 bottom-4 z-40 lg:hidden">
        <div className="rounded-[24px] border border-cyan-400/20 bg-[#08101c]/92 p-3 shadow-[0_20px_60px_-24px_rgba(8,145,178,0.5)] backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Đã chọn</p>
              <p className="text-sm font-medium text-white">{selected.name}</p>
            </div>
            <p className="text-lg font-semibold text-cyan-300">{formatVnd(selected.price)}</p>
          </div>
          <button
            onClick={buy}
            disabled={loading || selected.status === "out_of_stock"}
            className="button-primary w-full"
          >
            {selected.status === "out_of_stock" ? "Tạm hết hàng" : loading ? "Đang xử lý..." : "Mua ngay"}
            {!loading ? <ChevronRight className="size-4" /> : null}
          </button>
        </div>
      </div>
    </>
  );
}

function BuySummary({
  selected,
  input,
  setInput,
  error,
  loading,
  buy,
}: {
  selected: Variant;
  input: Record<string, string>;
  setInput: (value: Record<string, string>) => void;
  error: string | null;
  loading: boolean;
  buy: () => Promise<void>;
}) {
  return (
    <div className="space-y-5">
      <div>
        <StatusPill label="Buy box" tone="info" />
        <h3 className="mt-4 text-2xl font-semibold text-white">{selected.name}</h3>
        <p className="mt-2 text-sm text-slate-300">
          {FULFILLMENT_LABEL[selected.fulfillmentType] ?? selected.fulfillmentType}
        </p>
      </div>

      <div className="space-y-3 rounded-[24px] border border-white/8 bg-black/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-slate-400">Tổng tiền</span>
          <span className="text-2xl font-semibold text-cyan-300">{formatVnd(selected.price)}</span>
        </div>
        <div className="grid gap-2 text-sm text-slate-300">
          <div className="inline-flex items-center gap-2">
            <Clock3 className="size-4 text-cyan-300" />
            {selected.estimatedDeliveryMinutes
              ? `Ước tính xử lý khoảng ${selected.estimatedDeliveryMinutes} phút`
              : "Admin đang xử lý đơn thủ công"}
          </div>
          <div className="inline-flex items-center gap-2">
            <ShieldCheck className="size-4 text-emerald-300" />
            Bảo hành {selected.warrantyDays} ngày
          </div>
          <div className="inline-flex items-center gap-2">
            <Sparkles className="size-4 text-violet-300" />
            Thông tin sử dụng sẽ được gửi sau khi hoàn tất
          </div>
        </div>
      </div>

      {selected.requiresCustomerInput ? (
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-white">Thông tin cần cung cấp</p>
            <p className="mt-1 text-sm text-slate-400">Chỉ hiển thị các trường cần thiết cho gói đang chọn.</p>
          </div>
          {(selected.customerInputSchema?.fields ?? []).map((f) => (
            <div key={f.name}>
              <FieldLabel>{f.label}</FieldLabel>
              <TextInput
                type={f.type === "email" ? "email" : "text"}
                value={input[f.name] ?? ""}
                onChange={(e) => setInput({ ...input, [f.name]: e.target.value })}
              />
            </div>
          ))}
        </div>
      ) : null}

      <div className="rounded-[22px] border border-amber-400/12 bg-amber-400/6 p-4 text-sm leading-6 text-amber-100">
        <div className="inline-flex items-center gap-2 font-medium">
          <CheckCircle2 className="size-4 text-amber-300" />
          Sau khi thanh toán thành công, đơn sẽ chuyển sang trạng thái chờ admin xử lý.
        </div>
      </div>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <button
        onClick={buy}
        disabled={loading || selected.status === "out_of_stock"}
        className="button-primary w-full"
      >
        {selected.status === "out_of_stock" ? "Tạm hết hàng" : loading ? "Đang xử lý..." : "Mua ngay"}
        {!loading ? <ChevronRight className="size-4" /> : null}
      </button>
    </div>
  );
}
