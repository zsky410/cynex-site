"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  CheckCircle2,
  CreditCard,
  LoaderCircle,
  ShieldCheck,
  Smartphone,
  UserRound,
  WalletCards,
} from "lucide-react";
import { apiFetch, ApiError, getToken } from "@/lib/api";
import { cn, formatVnd } from "@/lib/utils";

interface Order {
  orderCode: string;
  totalAmount: number;
  paymentStatus: string;
  items: Array<{
    id: string;
    quantity: number;
    totalPrice: number;
    customerInput?: Record<string, unknown> | null;
    product: { name: string; slug: string };
    variant: { name: string; durationDays?: number | null };
  }>;
}

interface MeProfile {
  email: string;
  name?: string | null;
  walletBalance: number;
}

type PaymentMethod = "payos" | "wallet";

function toRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function findField(record: Record<string, unknown>, patterns: RegExp[]): string | null {
  for (const [key, value] of Object.entries(record)) {
    if (!patterns.some((pattern) => pattern.test(key))) continue;
    const resolved = readString(value);
    if (resolved) return resolved;
  }
  return null;
}

function formatDurationLabel(name: string, durationDays?: number | null): string {
  if (!durationDays) return name;
  if (durationDays >= 360) return `${Math.round(durationDays / 30)} tháng`;
  if (durationDays >= 30) return `${Math.round(durationDays / 30)} tháng`;
  return `${durationDays} ngày`;
}

export default function CheckoutPage({ params }: { params: Promise<{ orderCode: string }> }) {
  const { orderCode } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("payos");
  const [busyMethod, setBusyMethod] = useState<PaymentMethod | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push(`/login?next=${encodeURIComponent(`/checkout/${orderCode}`)}`);
      return;
    }

    Promise.all([
      apiFetch<Order>(`/orders/${orderCode}`),
      apiFetch<MeProfile>("/me").catch(() => null),
    ])
      .then(([orderRes, meRes]) => {
        setOrder(orderRes);
        setProfile(meRes);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Không tải được đơn"));
  }, [orderCode, router]);

  useEffect(() => {
    if (!profile) return;
    if (profile.walletBalance >= (order?.totalAmount ?? Number.MAX_SAFE_INTEGER)) {
      setSelectedMethod("wallet");
    }
  }, [order?.totalAmount, profile]);

  async function payPayos() {
    setBusyMethod("payos");
    setError(null);
    try {
      const res = await apiFetch<{ checkoutUrl: string }>(`/orders/${orderCode}/pay`, { method: "POST" });
      window.location.href = res.checkoutUrl;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Không tạo được thanh toán");
      setBusyMethod(null);
    }
  }

  async function payWallet() {
    setBusyMethod("wallet");
    setError(null);
    try {
      await apiFetch(`/orders/${orderCode}/pay-wallet`, { method: "POST" });
      router.push(`/orders/${orderCode}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Thanh toán ví thất bại");
      setBusyMethod(null);
    }
  }

  async function submitPayment() {
    if (selectedMethod === "wallet") {
      await payWallet();
      return;
    }
    await payPayos();
  }

  if (error && !order) return <p className="text-red-600">{error}</p>;
  if (!order) {
    return (
      <div className="min-h-screen bg-[#f5f7fc]">
        <div className="mx-auto flex max-w-[1180px] items-center justify-center px-5 py-24 lg:px-8">
          <div className="inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm text-slate-500 shadow-sm">
            <LoaderCircle className="h-4 w-4 animate-spin text-sky-600" />
            Đang tải thông tin thanh toán...
          </div>
        </div>
      </div>
    );
  }

  if (order.paymentStatus === "paid") {
    return (
      <div className="min-h-screen bg-[#f5f7fc]">
        <div className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-5 lg:px-8">
            <Link href="/" className="text-[21px] font-semibold tracking-[-0.04em] text-sky-900">
              CYNEX
            </Link>
            <Link href={`/orders/${orderCode}`} className="inline-flex items-center gap-2 text-sm text-slate-600 transition hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              Về đơn hàng
            </Link>
          </div>
        </div>

        <div className="mx-auto flex max-w-[760px] px-5 py-20 lg:px-8">
          <div className="w-full rounded-[28px] border border-emerald-100 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-slate-950">Đơn hàng đã được thanh toán</h1>
            <p className="mt-3 text-[17px] leading-8 text-slate-500">
              Chúng tôi đã ghi nhận thanh toán cho đơn <span className="font-semibold text-slate-700">#{order.orderCode}</span>.
              Hệ thống sẽ chuyển đơn sang trạng thái chờ admin xử lý.
            </p>
            <button
              onClick={() => router.push(`/orders/${orderCode}`)}
              className="mt-8 inline-flex items-center justify-center rounded-2xl bg-sky-700 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-sky-800"
            >
              Xem chi tiết đơn hàng
            </button>
          </div>
        </div>
      </div>
    );
  }

  const primaryItem = order.items[0];
  const customerInput = toRecord(primaryItem?.customerInput);
  const contactName = findField(customerInput, [/name/i, /recipient/i, /full/i]) ?? profile?.name ?? "Tài khoản của bạn";
  const contactEmail = findField(customerInput, [/email/i, /mail/i]) ?? profile?.email ?? "Sẽ dùng email đăng nhập hiện tại";
  const contactPhone = findField(customerInput, [/phone/i, /mobile/i, /tel/i]);
  const extraFields = Object.entries(customerInput).filter(([key, value]) => {
    if (!readString(value)) return false;
    return ![/name/i, /recipient/i, /full/i, /email/i, /mail/i, /phone/i, /mobile/i, /tel/i].some((pattern) =>
      pattern.test(key),
    );
  });
  const walletBalance = profile?.walletBalance ?? 0;
  const walletSufficient = walletBalance >= order.totalAmount;
  const isBusy = busyMethod !== null;
  const actionLabel =
    busyMethod === "payos"
      ? "Đang chuyển sang payOS..."
      : busyMethod === "wallet"
        ? "Đang thanh toán bằng ví..."
        : "Xác nhận & Thanh toán";

  return (
    <div className="min-h-screen bg-[#f5f7fc] text-slate-950">
      <div className="border-b border-slate-200/80 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-5 lg:px-8">
          <Link href="/" className="text-[21px] font-semibold tracking-[-0.04em] text-sky-900">
            CYNEX
          </Link>
          <Link
            href={`/orders/${orderCode}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Hủy thanh toán
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-[1180px] px-5 pb-20 pt-16 lg:px-8">
        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="space-y-8">
            <div>
              <h1 className="text-4xl font-semibold tracking-[-0.05em] text-slate-950 lg:text-[54px] lg:leading-[1.02]">
                Hoàn tất đơn hàng
              </h1>
              <p className="mt-3 text-lg text-slate-500">
                Vui lòng kiểm tra thông tin và chọn phương thức thanh toán.
              </p>
            </div>

            <div className="rounded-[24px] border border-sky-100 bg-sky-100/80 px-6 py-5 text-sky-950">
              <div className="flex items-start gap-4">
                <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-sky-700 text-white">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold">Lưu ý quan trọng</p>
                  <p className="mt-1 text-[15px] leading-7 text-sky-900/80">
                    Sau khi thanh toán thành công, đơn sẽ chuyển sang trạng thái chờ admin xử lý.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)] lg:p-10">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-[34px] font-semibold tracking-[-0.05em] text-slate-950">Thông tin nhận dịch vụ</h2>
                  <p className="mt-2 text-sm text-slate-500">
                    Thông tin này được dùng để xử lý đơn và gửi kết quả bàn giao.
                  </p>
                </div>
                <div className="hidden items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-sm text-slate-500 sm:inline-flex">
                  <UserRound className="h-4 w-4 text-sky-700" />
                  Đơn #{order.orderCode}
                </div>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-2">
                <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Người nhận</p>
                  <p className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-slate-950">{contactName}</p>
                </div>
                <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Số điện thoại</p>
                  <p className="mt-2 text-[28px] font-semibold tracking-[-0.04em] text-slate-950">
                    {contactPhone ?? "Không yêu cầu"}
                  </p>
                </div>
                <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-5 md:col-span-2">
                  <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Email nhận thông tin dịch vụ</p>
                  <p className="mt-2 break-all text-[28px] font-semibold tracking-[-0.04em] text-slate-950">
                    {contactEmail}
                  </p>
                </div>
                {extraFields.length ? (
                  <div className="rounded-[20px] border border-slate-200 bg-slate-50/80 p-5 md:col-span-2">
                    <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Thông tin bổ sung</p>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      {extraFields.map(([key, value]) => (
                        <div key={key} className="rounded-2xl border border-white bg-white px-4 py-3 text-sm text-slate-600">
                          <p className="font-medium capitalize text-slate-900">{key.replace(/[_-]+/g, " ")}</p>
                          <p className="mt-1 break-words">{readString(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.06)] lg:p-10">
              <h2 className="text-[34px] font-semibold tracking-[-0.05em] text-slate-950">Phương thức thanh toán</h2>
              <p className="mt-2 text-sm text-slate-500">
                Mọi giao dịch được mã hóa và bảo mật an toàn 100%.
              </p>

              <div className="mt-8 space-y-4">
                <button
                  type="button"
                  onClick={() => setSelectedMethod("payos")}
                  disabled={isBusy}
                  className={cn(
                    "flex w-full items-center justify-between rounded-[20px] border px-5 py-5 text-left transition",
                    selectedMethod === "payos"
                      ? "border-sky-300 bg-sky-50 shadow-[0_0_0_1px_rgba(14,165,233,0.12)]"
                      : "border-slate-200 bg-white hover:border-sky-200",
                    isBusy && "cursor-not-allowed opacity-80",
                  )}
                >
                  <span className="flex items-center gap-4">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-300">
                      <span
                        className={cn(
                          "h-3.5 w-3.5 rounded-full transition",
                          selectedMethod === "payos" ? "bg-sky-600" : "bg-transparent",
                        )}
                      />
                    </span>
                    <span>
                      <span className="block text-lg font-semibold text-slate-950">Chuyển khoản VietQR (payOS)</span>
                      <span className="mt-1 block text-sm text-slate-500">Tự động xác nhận trong 5-10 giây.</span>
                    </span>
                  </span>
                  <Smartphone className="h-6 w-6 text-sky-700" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!walletSufficient) return;
                    setSelectedMethod("wallet");
                  }}
                  disabled={isBusy}
                  className={cn(
                    "flex w-full items-center justify-between rounded-[20px] border px-5 py-5 text-left transition",
                    selectedMethod === "wallet"
                      ? "border-sky-300 bg-sky-50 shadow-[0_0_0_1px_rgba(14,165,233,0.12)]"
                      : "border-slate-200 bg-white hover:border-sky-200",
                    !walletSufficient && "border-slate-200 bg-slate-50/80",
                    isBusy && "cursor-not-allowed opacity-80",
                  )}
                >
                  <span className="flex items-center gap-4">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-300">
                      <span
                        className={cn(
                          "h-3.5 w-3.5 rounded-full transition",
                          selectedMethod === "wallet" ? "bg-sky-600" : "bg-transparent",
                        )}
                      />
                    </span>
                    <span>
                      <span className="flex flex-wrap items-center gap-2 text-lg font-semibold text-slate-950">
                        Ví CYNEX
                        <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-700">Gợi ý</span>
                      </span>
                      <span className="mt-1 block text-sm text-slate-500">
                        Số dư hiện tại: {formatVnd(walletBalance)}
                      </span>
                      {!walletSufficient ? (
                        <span className="mt-1 block text-sm font-medium text-amber-600">
                          Số dư chưa đủ. Nạp thêm trong trang Ví để dùng phương thức này.
                        </span>
                      ) : null}
                    </span>
                  </span>
                  <WalletCards className="h-6 w-6 text-sky-700" />
                </button>
              </div>
            </div>
          </section>

          <aside className="xl:sticky xl:top-24">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
              <h2 className="text-[28px] font-semibold tracking-[-0.05em] text-slate-950">Tóm tắt đơn hàng</h2>

              <div className="mt-6 space-y-4">
                {order.items.map((it) => (
                  <div key={it.id} className="flex items-start gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-700 via-sky-900 to-slate-950 text-white shadow-[0_16px_30px_rgba(15,23,42,0.24)]">
                      <CreditCard className="h-7 w-7" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[17px] font-semibold leading-6 text-slate-950">{it.product.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{formatDurationLabel(it.variant.name, it.variant.durationDays)}</p>
                      <p className="mt-1 text-sm text-slate-400">Dịch vụ số</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-semibold text-slate-950">{formatVnd(it.totalPrice)}</p>
                      <p className="text-sm text-slate-500">x{it.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 border-t border-slate-200 pt-6 text-[17px] text-slate-600">
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
                    <p className="text-[17px] font-semibold text-slate-950">Tổng cộng</p>
                    <p className="mt-1 text-sm text-slate-500">Đã bao gồm VAT</p>
                  </div>
                  <p className="text-[40px] font-semibold tracking-[-0.05em] text-sky-700">{formatVnd(order.totalAmount)}</p>
                </div>
              </div>

              {error ? <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

              <button
                onClick={submitPayment}
                disabled={isBusy || (selectedMethod === "wallet" && !walletSufficient)}
                className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-[18px] bg-sky-700 px-6 py-4 text-lg font-semibold text-white shadow-[0_18px_40px_rgba(10,116,184,0.24)] transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isBusy ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <BadgeCheck className="h-5 w-5" />}
                {actionLabel}
              </button>

              <div className="mt-5 flex items-center justify-center gap-2 text-sm text-slate-500">
                <ShieldCheck className="h-4 w-4" />
                Bảo mật SSL 256-bit
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
