"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, QrCode, Wallet } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusPill } from "@/components/ui/status-pill";
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

  if (error && !order) return <EmptyState title="Không tải được đơn" description={error} href="/orders" cta="Về danh sách đơn" />;
  if (!order) return <p className="text-sm text-slate-300">Đang tải checkout...</p>;

  if (order.paymentStatus === "paid") {
    return (
      <Panel className="mx-auto max-w-2xl text-center">
        <StatusPill label="Already paid" tone="success" />
        <h1 className="mt-4 text-3xl font-semibold text-white">Đơn này đã được thanh toán.</h1>
        <p className="mt-3 text-sm text-slate-300">Bạn có thể theo dõi tiếp trạng thái xử lý và thông tin giao hàng trong trang chi tiết đơn.</p>
        <button onClick={() => router.push(`/orders/${orderCode}`)} className="button-primary mt-6">
          Xem đơn
        </button>
      </Panel>
    );
  }

  return (
    <section className="space-y-6">
      <SectionHeader
        eyebrow="Checkout"
        title={`Thanh toán đơn #${order.orderCode}`}
        description="Sau khi thanh toán thành công, đơn sẽ chuyển sang trạng thái chờ admin xử lý."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <Panel className="space-y-5">
          <StatusPill label="Order summary" tone="info" />
          <div className="space-y-3">
            {order.items.map((it) => (
              <div key={it.id} className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-base font-medium text-white">{it.product.name}</p>
                    <p className="mt-1 text-sm text-slate-400">{it.variant.name}</p>
                  </div>
                  <p className="font-semibold text-cyan-300">{formatVnd(it.totalPrice)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="subtle-divider flex items-center justify-between pt-4">
            <span className="text-sm text-slate-400">Tổng thanh toán</span>
            <span className="text-2xl font-semibold text-white">{formatVnd(order.totalAmount)}</span>
          </div>
          <div className="rounded-[22px] border border-amber-400/12 bg-amber-400/6 p-4 text-sm leading-6 text-amber-100">
            <div className="inline-flex items-center gap-2 font-medium">
              <CheckCircle2 className="size-4 text-amber-300" />
              Đã thanh toán xong không đồng nghĩa với giao hàng ngay. Admin sẽ xử lý và cập nhật tiếp trong đơn của bạn.
            </div>
          </div>
        </Panel>

        <Panel className="space-y-4">
          <StatusPill label="Payment methods" tone="waiting" />
          <button onClick={payPayos} disabled={busy} className="w-full rounded-[24px] border border-cyan-400/20 bg-cyan-400/10 p-5 text-left disabled:opacity-60">
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex items-start gap-3">
                <QrCode className="mt-1 size-5 text-cyan-300" />
                <div>
                  <p className="text-base font-semibold text-white">payOS / VietQR</p>
                  <p className="mt-1 text-sm text-slate-300">Tạo mã thanh toán để hoàn tất đơn hàng ngay.</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-cyan-200" />
            </div>
          </button>
          <button onClick={payWallet} disabled={busy} className="w-full rounded-[24px] border border-white/10 bg-white/[0.04] p-5 text-left disabled:opacity-60">
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex items-start gap-3">
                <Wallet className="mt-1 size-5 text-violet-300" />
                <div>
                  <p className="text-base font-semibold text-white">Ví Cynex</p>
                  <p className="mt-1 text-sm text-slate-300">Thanh toán nội bộ nếu ví của bạn đã có số dư.</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-slate-300" />
            </div>
          </button>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <Link href={`/orders/${orderCode}`} className="button-secondary w-full">
            Quay lại chi tiết đơn
          </Link>
        </Panel>
      </div>
    </section>
  );
}
