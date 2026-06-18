"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
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

  if (error) return <p className="text-red-600">{error}</p>;
  if (!order) return <p>Đang tải...</p>;

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-xl border bg-white p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Đơn #{order.orderCode}</h1>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm">
            {FULFILLMENT_STATUS_LABEL[order.fulfillmentStatus]}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          {new Date(order.createdAt).toLocaleString("vi-VN")} · Thanh toán:{" "}
          {PAYMENT_STATUS_LABEL[order.paymentStatus]}
        </p>

        <ul className="mt-4 space-y-2 text-sm">
          {order.items.map((it) => (
            <li key={it.id} className="flex justify-between border-t pt-2">
              <span>{it.product.name} — {it.variant.name}</span>
              <span>{formatVnd(it.totalPrice)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t pt-3 font-bold">
          <span>Tổng</span>
          <span className="text-brand">{formatVnd(order.totalAmount)}</span>
        </div>

        {order.paymentStatus === "pending" && (
          <Link href={`/checkout/${order.orderCode}`} className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-white">
            Thanh toán ngay
          </Link>
        )}
      </div>

      {order.fulfillmentStatus === "delivered" && (
        <div className="rounded-xl border bg-white p-6">
          <h2 className="mb-3 font-bold">Thông tin đã giao</h2>
          {order.items.map((it) => (
            <div key={it.id} className="mb-4 rounded-lg bg-slate-50 p-4">
              <p className="mb-1 text-sm font-medium">{it.product.name} — {it.variant.name}</p>
              {it.fulfillment?.deliveredMessage ? (
                <pre className="whitespace-pre-wrap break-words text-sm">{it.fulfillment.deliveredMessage}</pre>
              ) : (
                <p className="text-sm text-slate-500">Đã giao. Liên hệ hỗ trợ nếu cần.</p>
              )}
              {it.variant.warrantyDays > 0 && (
                <p className="mt-2 text-xs text-slate-500">Bảo hành: {it.variant.warrantyDays} ngày</p>
              )}
              <Link href={`/orders/${order.orderCode}/warranty?item=${it.id}`} className="mt-2 inline-block text-sm text-brand">
                Yêu cầu hỗ trợ/bảo hành
              </Link>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
