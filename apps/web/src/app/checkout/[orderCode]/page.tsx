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
import {
  getConfiguredCustomerFields,
  validateCustomerInput,
} from "@/components/buy-panel-customer-input";
import { PremiumFooter, PremiumHeader } from "@/components/storefront/PremiumChrome";
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
    variant: {
      name: string;
      durationDays?: number | null;
      requiresCustomerInput: boolean;
      customerInputSchema?: { fields?: Array<{ name: string; label: string; type?: string; required?: boolean; placeholder?: string }> } | null;
    };
  }>;
}

interface MeProfile {
  email: string;
  name?: string | null;
  walletBalance: number;
}

type PaymentMethod = "sepay" | "wallet";

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

function buildEditableCustomerFields(
  schema: { fields?: Array<{ name: string; label: string; type?: string; required?: boolean; placeholder?: string }> } | null | undefined,
) {
  const configured = getConfiguredCustomerFields(schema);
  if (configured.length) return configured;
  return [
    { name: "name", label: "Người nhận", required: true, placeholder: "Nhập tên người nhận" },
    { name: "email", label: "Email nhận thông tin dịch vụ", type: "email", required: true, placeholder: "name@company.com" },
    { name: "phone", label: "Số điện thoại", type: "tel", required: false, placeholder: "Không bắt buộc" },
  ];
}

function customerFieldPriority(name: string) {
  if (/name|recipient|full/i.test(name)) return 0;
  if (/phone|mobile|tel/i.test(name)) return 1;
  if (/email|mail/i.test(name)) return 2;
  return 3;
}

function customerFieldLabel(field: { name: string; label: string }) {
  if (/name|recipient|full/i.test(field.name)) return "Tên";
  if (/phone|mobile|tel/i.test(field.name)) return "SĐT";
  if (/email|mail/i.test(field.name)) return "Email";
  return field.label;
}

export default function CheckoutPage({ params }: { params: Promise<{ orderCode: string }> }) {
  const { orderCode } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("sepay");
  const [busyMethod, setBusyMethod] = useState<PaymentMethod | null>(null);
  const [draftCustomerInput, setDraftCustomerInput] = useState<Record<string, string>>({});
  const [saveInfoError, setSaveInfoError] = useState<string | null>(null);
  const [savingInfo, setSavingInfo] = useState(false);

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
        const currentInput = toRecord(orderRes.items[0]?.customerInput);
        const nextDraft: Record<string, string> = {};
        for (const [key, value] of Object.entries(currentInput)) {
          nextDraft[key] = typeof value === "string" ? value : "";
        }
        nextDraft.name ??= findField(currentInput, [/name/i, /recipient/i, /full/i]) ?? meRes?.name ?? "";
        nextDraft.email ??= findField(currentInput, [/email/i, /mail/i]) ?? meRes?.email ?? "";
        nextDraft.phone ??= findField(currentInput, [/phone/i, /mobile/i, /tel/i]) ?? "";
        setDraftCustomerInput(nextDraft);
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : "Không tải được đơn"));
  }, [orderCode, router]);

  useEffect(() => {
    if (!profile) return;
    if (profile.walletBalance >= (order?.totalAmount ?? Number.MAX_SAFE_INTEGER)) {
      setSelectedMethod("wallet");
    }
  }, [order?.totalAmount, profile]);

  async function paySepay() {
    router.push(`/checkout/${orderCode}/payment`);
  }

  async function payWallet() {
    setBusyMethod("wallet");
    setError(null);
    try {
      await apiFetch(`/orders/${orderCode}/pay-wallet`, { method: "POST" });
      router.push(`/orders/${orderCode}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Thanh toán ví thất bại");
    } finally {
      setBusyMethod(null);
    }
  }

  async function submitPayment() {
    const saved = await ensureCustomerInfoSaved();
    if (!saved) return;
    if (selectedMethod === "wallet") {
      await payWallet();
      return;
    }
    await paySepay();
  }

  async function saveCustomerInfo(nextDraft = draftCustomerInput) {
    if (!order?.items[0]) return;
    const fields = buildEditableCustomerFields(order.items[0].variant.customerInputSchema);
    const validationError = validateCustomerInput(fields, nextDraft);
    if (validationError) {
      setSaveInfoError(validationError);
      return false;
    }

    setSavingInfo(true);
    setSaveInfoError(null);
    try {
      const updated = await apiFetch<Order>(`/orders/${orderCode}/customer-input`, {
        method: "PATCH",
        body: JSON.stringify({ customerInput: nextDraft }),
      });
      setOrder(updated);
      return true;
    } catch (e) {
      setSaveInfoError(e instanceof ApiError ? e.message : "Không lưu được thông tin");
      return false;
    } finally {
      setSavingInfo(false);
    }
  }

  async function ensureCustomerInfoSaved() {
    const currentInput: Record<string, string> = {
      name: contactName,
      email: contactEmail,
      phone: contactPhone ?? "",
      ...Object.fromEntries(Object.entries(customerInput).filter(([, value]) => typeof value === "string")),
    };
    const isDirty = Object.entries(draftCustomerInput).some(([key, value]) => (currentInput[key] ?? "") !== value);
    if (!isDirty) return true;
    return saveCustomerInfo();
  }

  if (error && !order) return <p className="text-red-600">{error}</p>;
  if (!order) {
    return (
      <div className="min-h-screen bg-[#f5f7fc]">
        <PremiumHeader />
        <div className="mx-auto flex max-w-[1180px] items-center justify-center px-5 py-24 lg:px-8">
          <div className="inline-flex items-center gap-3 rounded-full bg-white px-5 py-3 text-sm text-slate-500 shadow-sm">
            <LoaderCircle className="h-4 w-4 animate-spin text-sky-600" />
            Đang tải thông tin thanh toán...
          </div>
        </div>
        <PremiumFooter />
      </div>
    );
  }

  if (order.paymentStatus === "paid") {
    return (
      <div className="min-h-screen bg-[#f5f7fc]">
        <PremiumHeader />

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
        <PremiumFooter />
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
  const customerFields = buildEditableCustomerFields(primaryItem?.variant.customerInputSchema).sort(
    (a, b) => customerFieldPriority(a.name) - customerFieldPriority(b.name),
  );
  const actionLabel =
    busyMethod === "wallet"
        ? "Đang thanh toán bằng ví..."
        : selectedMethod === "wallet"
          ? "Tiếp tục & Thanh toán"
          : "Tiếp tục đến thanh toán";

  return (
    <div className="home-shell min-h-screen text-slate-950">
      <PremiumHeader />

      <main className="mx-auto max-w-[1180px] px-5 pb-16 pt-10 lg:px-8">
        <Link
          href={`/orders/${orderCode}`}
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-sky-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Hủy thanh toán
        </Link>
        <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-12">
          <section className="min-w-0">
            <div className="border-b border-slate-200/70 pb-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-4 py-2 text-sm text-slate-500">
                <UserRound className="h-4 w-4 text-sky-700" />
                Đơn #{order.orderCode}
              </div>
            </div>

            <div className="mt-7 border-b border-slate-200/70 pb-7">
              <div>
                <h2 className="text-[24px] font-semibold tracking-[-0.04em] text-slate-950">Thông tin nhận hàng</h2>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {customerFields.map((field) => (
                  <div key={field.name} className={cn(/email|mail/i.test(field.name) ? "md:col-span-2" : "")}>
                    <label className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">
                      {customerFieldLabel(field)}
                      {field.required ? <span className="ml-1 text-red-500">*</span> : null}
                    </label>
                    <input
                      type={field.type === "email" || field.type === "password" || field.type === "tel" ? field.type : "text"}
                      placeholder={field.placeholder ?? `Nhập ${field.label.toLowerCase()}`}
                      value={draftCustomerInput[field.name] ?? ""}
                      onChange={(e) => {
                        const value = e.target.value;
                        setDraftCustomerInput((current) => ({ ...current, [field.name]: value }));
                      }}
                      onBlur={() => {
                        void ensureCustomerInfoSaved();
                      }}
                      className="mt-2 w-full rounded-2xl border border-slate-200/90 bg-white/88 px-4 py-3.5 text-[15px] text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-sky-300 focus:bg-white"
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 min-h-5 text-sm text-slate-500">
                {savingInfo ? "Đang lưu thay đổi..." : null}
                {!savingInfo && saveInfoError ? <span className="text-red-600">{saveInfoError}</span> : null}
              </div>

              {extraFields.length ? (
                <div className="mt-5 border-t border-slate-200/70 pt-5">
                  <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-slate-400">Thông tin bổ sung</p>
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {extraFields.map(([key, value]) => (
                      <div key={key} className="rounded-2xl border border-slate-200/80 bg-white/75 px-4 py-3 text-sm text-slate-600">
                        <p className="font-medium capitalize text-slate-900">{key.replace(/[_-]+/g, " ")}</p>
                        <p className="mt-1 break-words">{readString(value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-7">
                <h2 className="text-[24px] font-semibold tracking-[-0.04em] text-slate-950">Phương thức thanh toán</h2>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("sepay")}
                    disabled={isBusy}
                    className={cn(
                      "flex min-h-[128px] w-full items-start justify-between rounded-[22px] border px-5 py-5 text-left transition",
                      selectedMethod === "sepay"
                        ? "border-sky-300 bg-white"
                        : "border-slate-200/90 bg-white/78 hover:border-sky-200",
                      isBusy && "cursor-not-allowed opacity-80",
                    )}
                  >
                    <span className="flex items-start gap-4">
                      <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full border border-slate-300">
                        <span
                          className={cn(
                            "h-3 w-3 rounded-full transition",
                            selectedMethod === "sepay" ? "bg-sky-600" : "bg-transparent",
                          )}
                        />
                      </span>
                      <span>
                        <span className="block text-[17px] font-semibold text-slate-950">Chuyển khoản SePay</span>
                        <span className="mt-2 block text-sm leading-6 text-slate-500">Quét QR để thanh toán ở bước tiếp theo.</span>
                      </span>
                    </span>
                    <Smartphone className="mt-1 h-5 w-5 shrink-0 text-sky-700" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!walletSufficient) return;
                      setSelectedMethod("wallet");
                    }}
                    disabled={isBusy}
                    className={cn(
                      "flex min-h-[128px] w-full items-start justify-between rounded-[22px] border px-5 py-5 text-left transition",
                      selectedMethod === "wallet"
                        ? "border-sky-300 bg-white"
                        : "border-slate-200/90 bg-white/78 hover:border-sky-200",
                      !walletSufficient && "bg-slate-50/85",
                      isBusy && "cursor-not-allowed opacity-80",
                    )}
                  >
                    <span className="flex items-start gap-4">
                      <span className="mt-1 flex h-6 w-6 items-center justify-center rounded-full border border-slate-300">
                        <span
                          className={cn(
                            "h-3 w-3 rounded-full transition",
                            selectedMethod === "wallet" ? "bg-sky-600" : "bg-transparent",
                          )}
                        />
                      </span>
                      <span>
                        <span className="flex flex-wrap items-center gap-2 text-[17px] font-semibold text-slate-950">
                          Ví CYNEX
                          <span className="rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-medium text-sky-700">Gợi ý</span>
                        </span>
                        <span className="mt-2 block text-sm leading-6 text-slate-500">Số dư: {formatVnd(walletBalance)}</span>
                        {!walletSufficient ? (
                          <span className="mt-1 block text-sm font-medium text-amber-600">
                            Số dư chưa đủ. Nạp thêm để thanh toán bằng ví.
                          </span>
                        ) : null}
                      </span>
                    </span>
                    <WalletCards className="mt-1 h-5 w-5 shrink-0 text-sky-700" />
                  </button>
                </div>
              </div>
            </div>
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
                onClick={() => void submitPayment()}
                disabled={isBusy || (selectedMethod === "wallet" && !walletSufficient)}
                className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-[20px] bg-sky-700 px-6 py-4 text-lg font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
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
      <PremiumFooter />
    </div>
  );
}
