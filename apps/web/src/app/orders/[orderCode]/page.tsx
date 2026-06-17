"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { CheckCircle2, CreditCard, LifeBuoy, ShieldCheck } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusPill } from "@/components/ui/status-pill";
import { formatVnd } from "@/lib/utils";
import { FULFILLMENT_STATUS_LABEL, PAYMENT_STATUS_LABEL } from "@/lib/status";

interface Item {
  id: string;
  totalPrice: number;
  status: string;
  product: { name: string };
  variant: { name: string; warrantyDays: number };
  fulfillment?: { status: string; deliveredMessage?: string | null; manualNote?: string | null } | null;
}

interface OrderDetail {
  orderCode: string;
  totalAmount: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
  items: Item[];
}

export default function OrderDetailPage({ params }: { params: Promise<{ orderCode: string }> }) {
  const { orderCode } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<OrderDetail>(`/orders/${orderCode}`)
      .then(setOrder)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Không tải được đơn"));
  }, [orderCode]);

  if (error) return <EmptyState title="Không tải được đơn hàng" description={error} href="/orders" cta="Quay lại danh sách đơn" />;
  if (!order) return <p className="text-sm text-slate-300">Đang tải chi tiết đơn...</p>;

  return (
    <section className="space-y-6">
      <SectionHeader
        eyebrow="Order detail"
        title={`Đơn #${order.orderCode}`}
        description="Chi tiết thanh toán, tiến độ xử lý và thông tin sử dụng được gom lại trong một màn rõ trạng thái."
      />

      <Panel className="space-y-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="font-[var(--font-mono)] text-lg text-white">#{order.orderCode}</p>
            <p className="mt-2 text-sm text-slate-400">{new Date(order.createdAt).toLocaleString("vi-VN")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill label={FULFILLMENT_STATUS_LABEL[order.fulfillmentStatus]} tone={order.fulfillmentStatus === "delivered" ? "success" : order.fulfillmentStatus === "failed" ? "danger" : "info"} />
            <StatusPill label={PAYMENT_STATUS_LABEL[order.paymentStatus]} tone={order.paymentStatus === "paid" ? "success" : order.paymentStatus === "pending" ? "waiting" : "danger"} />
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-3">
          <div className="metric-tile">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Tổng</p>
            <p className="mt-2 text-2xl font-semibold text-cyan-300">{formatVnd(order.totalAmount)}</p>
          </div>
          <div className="metric-tile">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Thanh toán</p>
            <p className="mt-2 text-sm text-slate-200">{PAYMENT_STATUS_LABEL[order.paymentStatus]}</p>
          </div>
          <div className="metric-tile">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Xử lý</p>
            <p className="mt-2 text-sm text-slate-200">{FULFILLMENT_STATUS_LABEL[order.fulfillmentStatus]}</p>
          </div>
        </div>

        <div className="space-y-3">
          {order.items.map((it) => (
            <div key={it.id} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-base font-medium text-white">{it.product.name}</p>
                  <p className="mt-1 text-sm text-slate-400">{it.variant.name}</p>
                </div>
                <p className="font-semibold text-cyan-300">{formatVnd(it.totalPrice)}</p>
              </div>
            </div>
          ))}
        </div>

        {order.paymentStatus === "pending" ? (
          <Link href={`/checkout/${order.orderCode}`} className="button-primary w-full md:w-auto">
            <CreditCard className="size-4" />
            Thanh toán ngay
          </Link>
        ) : null}
      </Panel>

      {order.fulfillmentStatus === "delivered" ? (
        <Panel className="space-y-4">
          <div>
            <StatusPill label="Delivered info" tone="success" />
            <h2 className="mt-4 text-2xl font-semibold text-white">Thông tin đã giao</h2>
          </div>
          {order.items.map((it) => (
            <div key={it.id} className="rounded-[24px] border border-emerald-400/12 bg-emerald-400/6 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">{it.product.name} — {it.variant.name}</p>
                  <div className="mt-3 rounded-2xl border border-white/8 bg-[#08101d] p-4 font-[var(--font-mono)] text-sm text-slate-200">
                    {it.fulfillment?.deliveredMessage ? (
                      <pre className="whitespace-pre-wrap break-words">{it.fulfillment.deliveredMessage}</pre>
                    ) : (
                      <p>Đã giao. Liên hệ hỗ trợ nếu cần thêm hướng dẫn sử dụng.</p>
                    )}
                  </div>
                </div>
                {it.variant.warrantyDays > 0 ? (
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-slate-200">
                    <ShieldCheck className="size-3.5 text-emerald-300" />
                    BH {it.variant.warrantyDays} ngày
                  </div>
                ) : null}
              </div>
              <Link href={`/orders/${order.orderCode}/warranty?item=${it.id}`} className="button-secondary mt-4">
                <LifeBuoy className="size-4" />
                Yêu cầu hỗ trợ / bảo hành
              </Link>
            </div>
          ))}
        </Panel>
      ) : (
        <Panel className="flex items-start gap-3">
          <CheckCircle2 className="mt-1 size-5 shrink-0 text-cyan-300" />
          <div className="text-sm leading-6 text-slate-300">
            Thông tin sử dụng sẽ chỉ xuất hiện tại đây sau khi đơn được hoàn tất. Trước đó, bạn có thể tiếp tục theo dõi trạng thái xử lý trong trang này.
          </div>
        </Panel>
      )}
    </section>
  );
}
