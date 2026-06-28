"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, CheckCircle2, CreditCard, LoaderCircle, ShieldCheck } from "lucide-react";
import {
  BankTransferInstructions,
  type BankTransferPayment,
} from "@/components/payments/BankTransferInstructions";
import { PremiumFooter, PremiumHeader } from "@/components/storefront/PremiumChrome";
import { apiFetch, ApiError, getToken } from "@/lib/api";
import { formatVnd } from "@/lib/utils";

interface PaymentOrder {
  orderCode: string;
  totalAmount: number;
  paymentStatus: string;
  items: Array<{
    id: string;
    quantity: number;
    totalPrice: number;
    product: { name: string };
    variant: { name: string; durationDays?: number | null };
  }>;
}

function formatDurationLabel(name: string, durationDays?: number | null): string {
  if (!durationDays) return name;
  if (durationDays >= 360) return `${Math.round(durationDays / 30)} tháng`;
  if (durationDays >= 30) return `${Math.round(durationDays / 30)} tháng`;
  return `${durationDays} ngày`;
}

export default function CheckoutPaymentPage({ params }: { params: Promise<{ orderCode: string }> }) {
  const { orderCode } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<PaymentOrder | null>(null);
  const [payment, setPayment] = useState<BankTransferPayment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [creatingPayment, setCreatingPayment] = useState(false);
  const [paymentExpired, setPaymentExpired] = useState(false);
  const requestedInitialPaymentRef = useRef(false);

  useEffect(() => {
    if (!getToken()) {
      router.push(`/login?next=${encodeURIComponent(`/checkout/${orderCode}/payment`)}`);
      return;
    }

    setLoadingOrder(true);
    apiFetch<PaymentOrder>(`/orders/${orderCode}`)
      .then((res) => {
        setOrder(res);
        setError(null);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Không tải được đơn"))
      .finally(() => setLoadingOrder(false));
  }, [orderCode, router]);

  async function createPayment() {
    setCreatingPayment(true);
    setError(null);
    try {
      const res = await apiFetch<BankTransferPayment>(`/orders/${orderCode}/pay`, { method: "POST" });
      setPayment(res);
      setPaymentExpired(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Không tạo được thanh toán");
    } finally {
      setCreatingPayment(false);
    }
  }

  useEffect(() => {
    if (!order || order.paymentStatus !== "pending" || requestedInitialPaymentRef.current) return;
    requestedInitialPaymentRef.current = true;
    void createPayment();
  }, [order]);

  if (loadingOrder || !order) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f5f7fc_0%,#eef4fb_100%)]">
        <PremiumHeader />
        <div className="mx-auto flex min-h-screen max-w-[1180px] items-center justify-center px-5 lg:px-8">
          <div className="inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm text-slate-500 shadow-sm">
            <LoaderCircle className="h-4 w-4 animate-spin text-sky-600" />
            Đang chuẩn bị thanh toán...
          </div>
        </div>
        <PremiumFooter />
      </div>
    );
  }

  if (order.paymentStatus === "paid") {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#f5f7fc_0%,#eef4fb_100%)] text-slate-950">
        <PremiumHeader />
        <div className="mx-auto max-w-[760px] px-5 py-20 lg:px-8">
          <div className="rounded-[32px] border border-emerald-100 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-slate-950">Đơn hàng đã được thanh toán</h1>
            <p className="mt-3 text-[17px] leading-8 text-slate-500">
              Thanh toán cho đơn <span className="font-semibold text-slate-700">#{order.orderCode}</span> đã được ghi nhận.
            </p>
            <Link
              href={`/orders/${order.orderCode}`}
              className="mt-8 inline-flex items-center justify-center rounded-2xl bg-sky-700 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-sky-800"
            >
              Xem chi tiết đơn hàng
            </Link>
          </div>
        </div>
        <PremiumFooter />
      </div>
    );
  }

  return (
    <div className="home-shell min-h-screen text-slate-950">
      <PremiumHeader />

      <main className="mx-auto max-w-[1180px] px-5 pb-16 pt-12 lg:px-8">
        <Link
          href={`/checkout/${orderCode}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-sky-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại checkout
        </Link>
        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-10">
            <section className="min-w-0">
              {payment ? (
                <BankTransferInstructions
                  payment={payment}
                  onExpired={() => {
                    setPayment(null);
                    setPaymentExpired(true);
                    setError("Phiên thanh toán đã hết hạn sau 10 phút. Hãy tạo mã QR mới để tiếp tục.");
                  }}
                />
              ) : paymentExpired ? (
                <div className="rounded-[32px] border border-amber-100 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.07)]">
                  <h1 className="text-[30px] font-semibold tracking-[-0.04em] text-slate-950">Phiên thanh toán đã hết hạn</h1>
                  <p className="mt-3 max-w-2xl text-base leading-8 text-slate-500">
                    Mã QR chỉ có hiệu lực trong 10 phút. Tạo mã mới để hệ thống tiếp tục đối soát tự động.
                  </p>
                  <button
                    type="button"
                    onClick={() => void createPayment()}
                    disabled={creatingPayment}
                    className="mt-6 inline-flex items-center justify-center gap-3 rounded-[18px] bg-sky-700 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {creatingPayment ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                    Tạo mã QR mới
                  </button>
                </div>
              ) : (
                <div className="rounded-[32px] border border-sky-100/80 bg-white/85 p-8 text-slate-500 shadow-[0_24px_80px_rgba(15,23,42,0.07)]">
                    <div className="inline-flex items-center gap-3 text-sm">
                      <LoaderCircle className="h-4 w-4 animate-spin text-sky-600" />
                      Đang tạo mã QR thanh toán...
                    </div>
                </div>
              )}
            </section>

            <aside className="xl:sticky xl:top-24">
              <div className="xl:border-l xl:border-slate-200/70 xl:pl-8">
                <h2 className="text-[24px] font-semibold tracking-[-0.04em] text-slate-950">Tóm tắt đơn hàng</h2>

                <div className="mt-6 space-y-4">
                  {order.items.map((it) => (
                    <div key={it.id} className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 via-sky-900 to-slate-950 text-white">
                        <CreditCard className="h-6 w-6" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-base font-semibold leading-6 text-slate-950">{it.product.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{formatDurationLabel(it.variant.name, it.variant.durationDays)}</p>
                        <p className="mt-1 text-sm text-slate-400">Dịch vụ số</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[18px] font-semibold text-slate-950">{formatVnd(it.totalPrice)}</p>
                        <p className="text-sm text-slate-500">x{it.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 border-t border-slate-200 pt-6 text-base text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Tạm tính</span>
                    <span>{formatVnd(order.totalAmount)}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span>Giảm giá</span>
                    <span>- {formatVnd(0)}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <span>Phí giao dịch</span>
                    <span>Miễn phí</span>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-200 pt-6">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-base font-semibold text-slate-950">Tổng cộng</p>
                      <p className="mt-1 text-sm text-slate-500">Đã bao gồm VAT</p>
                    </div>
                    <p className="text-[34px] font-semibold tracking-[-0.05em] text-sky-700">{formatVnd(order.totalAmount)}</p>
                  </div>
                </div>

                {error ? <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

                <button
                  type="button"
                  onClick={() => void createPayment()}
                  disabled={creatingPayment}
                  className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-[20px] bg-sky-700 px-6 py-4 text-lg font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingPayment ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <BadgeCheck className="h-5 w-5" />}
                  Tạo mã QR mới
                </button>

                <div className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-500">
                  <ShieldCheck className="h-4 w-4" />
                  Bảo mật SSL 256-bit
                </div>
              </div>
            </aside>
          </div>
      </main>
      <PremiumFooter />
    </div>
  );
}
