"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getToken, ApiError } from "@/lib/api";
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

  if (!orders) return <p>Đang tải...</p>;

  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold">Đơn của tôi</h1>
      <div className="space-y-3">
        {orders.map((o) => (
          <Link
            key={o.orderCode}
            href={`/orders/${o.orderCode}`}
            className="flex items-center justify-between rounded-xl border bg-white p-4 hover:shadow-sm"
          >
            <div>
              <p className="font-medium">#{o.orderCode}</p>
              <p className="text-xs text-slate-500">{new Date(o.createdAt).toLocaleString("vi-VN")}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-brand">{formatVnd(o.totalAmount)}</p>
              <p className="text-xs text-slate-500">{FULFILLMENT_STATUS_LABEL[o.fulfillmentStatus]}</p>
            </div>
          </Link>
        ))}
        {orders.length === 0 && <p className="text-slate-500">Chưa có đơn nào.</p>}
      </div>
    </section>
  );
}
