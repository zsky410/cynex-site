"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  OrderDetailLink,
  OrderListIcon,
  OrderMetaLine,
  OrderPageLayout,
  OrderStatusBadge,
  PrimaryButton,
} from "@/components/orders/OrderUi";
import { apiFetch, getToken, ApiError } from "@/lib/api";
import { ORDER_FILTER_TABS } from "@/lib/status";
import { cn, formatVnd } from "@/lib/utils";

interface OrderRow {
  orderCode: string;
  totalAmount: number;
  fulfillmentStatus: string;
  paymentStatus: string;
  createdAt: string;
  items: { id: string; totalPrice: number }[];
}

export default function OrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [filter, setFilter] = useState<(typeof ORDER_FILTER_TABS)[number]["key"]>("all");
  const [search, setSearch] = useState("");

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

  const filtered = useMemo(() => {
    if (!orders) return [];
    let rows = orders;
    if (filter !== "all") {
      if (filter === "processing") {
        rows = rows.filter((o) => o.fulfillmentStatus === "processing" || o.fulfillmentStatus === "assigned");
      } else {
        rows = rows.filter((o) => o.fulfillmentStatus === filter);
      }
    }
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((o) => o.orderCode.toLowerCase().includes(q));
  }, [orders, filter, search]);

  if (!orders) {
    return (
      <OrderPageLayout title="Lịch sử đơn hàng" subtitle="Đang tải...">
        <div className="h-40 animate-pulse rounded-[20px] bg-white/60" />
      </OrderPageLayout>
    );
  }

  return (
    <OrderPageLayout
      title="Lịch sử đơn hàng"
      subtitle="Quản lý và theo dõi trạng thái các dịch vụ số của bạn."
    >
      {searchParams.get("created") ? (
        <div className="mb-5 rounded-[18px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Đã tạo {searchParams.get("created")} đơn hàng từ giỏ.
          {searchParams.get("failed")
            ? ` ${searchParams.get("failed")} sản phẩm chưa tạo được, bạn có thể thử lại trong giỏ hàng.`
            : " Hãy tiếp tục thanh toán để hoàn tất."}
        </div>
      ) : null}

      <div className="mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm theo mã đơn..."
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 sm:max-w-xs"
        />
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {ORDER_FILTER_TABS.map((tab) => {
          const active = filter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                active
                  ? "bg-sky-600 text-white shadow-[0_6px_20px_rgba(10,116,184,0.25)]"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-700",
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {filtered.map((o) => {
          const pendingPay =
            o.paymentStatus === "pending" && o.fulfillmentStatus === "waiting_payment";

          return (
            <article
              key={o.orderCode}
              className="flex flex-col gap-4 rounded-[20px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex min-w-0 flex-1 items-start gap-4">
                <OrderListIcon />
                <div className="min-w-0">
                  <OrderMetaLine
                    orderCode={o.orderCode}
                    createdAt={o.createdAt}
                    itemCount={o.items.length}
                  />
                  <p className="mt-1 truncate text-lg font-semibold text-slate-900">
                    Đơn #{o.orderCode}
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {o.items.length === 1 ? "1 dịch vụ số" : `${o.items.length} dịch vụ số`}
                  </p>
                </div>
              </div>

              <div className="flex shrink-0 items-center justify-between gap-6 sm:flex-col sm:items-end sm:justify-center">
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">{formatVnd(o.totalAmount)}</p>
                  <div className="mt-2">
                    <OrderStatusBadge status={o.fulfillmentStatus} />
                  </div>
                </div>
                <div className="sm:mt-1">
                  {pendingPay ? (
                    <PrimaryButton href={`/checkout/${o.orderCode}`}>Thanh toán</PrimaryButton>
                  ) : (
                    <OrderDetailLink href={`/orders/${o.orderCode}`} />
                  )}
                </div>
              </div>
            </article>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-[20px] border border-dashed border-slate-200 bg-white/70 px-6 py-16 text-center">
            <p className="text-slate-500">
              {orders.length === 0 ? "Chưa có đơn hàng nào." : "Không có đơn nào trong bộ lọc này."}
            </p>
            {orders.length === 0 && (
              <Link
                href="/products"
                className="mt-4 inline-flex text-sm font-semibold text-sky-700 hover:text-sky-900"
              >
                Khám phá sản phẩm →
              </Link>
            )}
          </div>
        )}
      </div>
    </OrderPageLayout>
  );
}
