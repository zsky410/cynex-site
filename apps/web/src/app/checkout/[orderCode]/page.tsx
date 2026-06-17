"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { formatVnd } from "@/lib/utils";

interface Order {
  orderCode: string;
  totalAmount: number;
  paymentStatus: string;
  items: { id: string; totalPrice: number; product: { name: string }; variant: { name: string } }[];
}

export default function CheckoutPage({ params }: { params: Promise<{ orderCode: string }> }) {
  const { orderCode } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiFetch<Order>(`/orders/${orderCode}`)
      .then(setOrder)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Không tải được đơn"));
  }, [orderCode]);

  async function payPayos() {
    setBusy(true);
    setError(null);
    try {
      const res = await apiFetch<{ checkoutUrl: string }>(`/orders/${orderCode}/pay`, { method: "POST" });
      window.location.href = res.checkoutUrl;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Không tạo được thanh toán");
      setBusy(false);
    }
  }

  async function payWallet() {
    setBusy(true);
    setError(null);
    try {
      await apiFetch(`/orders/${orderCode}/pay-wallet`, { method: "POST" });
      router.push(`/orders/${orderCode}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Thanh toán ví thất bại");
      setBusy(false);
    }
  }

  if (error && !order) return <p className="text-red-600">{error}</p>;
  if (!order) return <p>Đang tải...</p>;

  if (order.paymentStatus === "paid") {
    return (
      <div className="mx-auto max-w-md rounded-xl border bg-white p-6">
        <p>Đơn này đã được thanh toán.</p>
        <button onClick={() => router.push(`/orders/${orderCode}`)} className="mt-4 rounded-lg bg-brand px-4 py-2 text-white">
          Xem đơn
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4 rounded-xl border bg-white p-6">
      <h1 className="text-xl font-bold">Thanh toán đơn #{order.orderCode}</h1>
      <ul className="space-y-1 text-sm">
        {order.items.map((it) => (
          <li key={it.id} className="flex justify-between">
            <span>{it.product.name} — {it.variant.name}</span>
            <span>{formatVnd(it.totalPrice)}</span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between border-t pt-3 font-bold">
        <span>Tổng</span>
        <span className="text-brand">{formatVnd(order.totalAmount)}</span>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button onClick={payPayos} disabled={busy} className="w-full rounded-lg bg-brand py-2.5 font-medium text-white disabled:opacity-50">
        Thanh toán qua payOS
      </button>
      <button onClick={payWallet} disabled={busy} className="w-full rounded-lg border py-2.5 font-medium disabled:opacity-50">
        Thanh toán bằng ví
      </button>
    </div>
  );
}
