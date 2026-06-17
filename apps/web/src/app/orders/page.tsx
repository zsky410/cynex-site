"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { apiFetch, getToken, ApiError } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusPill } from "@/components/ui/status-pill";
import { formatVnd } from "@/lib/utils";
import { FULFILLMENT_STATUS_LABEL } from "@/lib/status";

interface OrderRow {
  orderCode: string;
  totalAmount: number;
  fulfillmentStatus: string;
  createdAt: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login?next=/orders");
      return;
    }
    apiFetch<OrderRow[]>("/orders")
      .then(setOrders)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) router.push("/login?next=/orders");
      });
  }, [router]);

  if (!orders) return <p className="text-sm text-slate-300">Đang tải đơn hàng...</p>;

  return (
    <section className="space-y-6">
      <SectionHeader
        eyebrow="Orders"
        title="Theo dõi đơn của bạn theo trạng thái rõ ràng"
        description="Mỗi đơn giữ cùng một cấu trúc hiển thị để bạn biết đang chờ thanh toán, chờ xử lý hay đã được giao."
      />
      <div className="space-y-4">
        {orders.map((o) => (
          <Link key={o.orderCode} href={`/orders/${o.orderCode}`} className="panel flex flex-col gap-4 hover:border-cyan-400/20">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Order code</p>
                <p className="mt-2 font-[var(--font-mono)] text-lg text-white">#{o.orderCode}</p>
                <p className="mt-2 text-sm text-slate-400">{new Date(o.createdAt).toLocaleString("vi-VN")}</p>
              </div>
              <div className="flex flex-col items-start gap-3 md:items-end">
                <StatusPill label={FULFILLMENT_STATUS_LABEL[o.fulfillmentStatus]} tone={o.fulfillmentStatus === "delivered" ? "success" : o.fulfillmentStatus === "failed" ? "danger" : "info"} />
                <p className="text-2xl font-semibold text-cyan-300">{formatVnd(o.totalAmount)}</p>
              </div>
            </div>
            <div className="subtle-divider flex items-center justify-between pt-4 text-sm text-slate-300">
              <span>Mở chi tiết đơn và thông tin giao hàng</span>
              <span className="inline-flex items-center gap-2 text-cyan-300">
                Xem chi tiết
                <ArrowRight className="size-4" />
              </span>
            </div>
          </Link>
        ))}
        {orders.length === 0 ? (
          <EmptyState
            title="Bạn chưa có đơn nào"
            description="Khi bắt đầu mua hàng, mọi trạng thái sẽ xuất hiện tại đây để bạn theo dõi từ thanh toán tới bảo hành."
            href="/products"
            cta="Bắt đầu xem sản phẩm"
          />
        ) : null}
      </div>
    </section>
  );
}
