"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Headphones,
  KeyRound,
  Package,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import { PremiumFooter, PremiumHeader } from "@/components/storefront/PremiumChrome";
import {
  FULFILLMENT_STATUS_BADGE,
  FULFILLMENT_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
} from "@/lib/status";
import { cn, formatVnd } from "@/lib/utils";

export function OrderPageLayout({
  activeKey,
  backHref,
  backLabel,
  title,
  subtitle,
  badge,
  children,
}: {
  activeKey?: "orders" | "support";
  backHref?: string;
  backLabel?: string;
  title: string;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="home-shell min-h-screen">
      <PremiumHeader activeKey={activeKey === "support" ? "support" : "orders"} />
      <main className="mx-auto max-w-[1180px] px-5 pb-20 pt-8 lg:px-8 lg:pt-10">
        {backHref && (
          <Link
            href={backHref}
            className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-sky-700 transition hover:text-sky-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Link>
        )}

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="section-title text-3xl font-semibold tracking-[-0.03em] text-slate-950 lg:text-4xl">
              {title}
            </h1>
            {subtitle && <div className="mt-2 text-sm text-slate-500">{subtitle}</div>}
          </div>
          {badge}
        </div>

        {children}
      </main>
      <PremiumFooter />
    </div>
  );
}

export function OrderStatusBadge({ status }: { status: string }) {
  const label = FULFILLMENT_STATUS_LABEL[status] ?? status;
  const colors = FULFILLMENT_STATUS_BADGE[status] ?? "bg-slate-100 text-slate-600";
  const isDelivered = status === "delivered";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide",
        colors,
      )}
    >
      {isDelivered && <CheckCircle2 className="h-3.5 w-3.5" />}
      {label}
    </span>
  );
}

export function OrderCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <section
      className={cn(
        "rounded-[20px] border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function OrderSectionTitle({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
      {icon}
      {children}
    </h2>
  );
}

export function OrderTimeline({
  createdAt,
  paidAt,
  deliveredAt,
  fulfillmentStatus,
  paymentStatus,
}: {
  createdAt: string;
  paidAt?: string | null;
  deliveredAt?: string | null;
  fulfillmentStatus: string;
  paymentStatus: string;
}) {
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("vi-VN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  const paid =
    paymentStatus === "paid" || paymentStatus === "refunded" || !!paidAt;
  const processing = ["paid_waiting_admin", "processing", "assigned", "delivered"].includes(fulfillmentStatus);
  const delivered = fulfillmentStatus === "delivered";

  const steps = [
    { label: "Đã tạo đơn", done: true, at: createdAt },
    { label: "Đã thanh toán", done: paid, at: paidAt ?? undefined },
    { label: "Hệ thống xử lý", done: processing && paid, at: paid && !delivered ? paidAt ?? undefined : undefined },
    { label: "Đã giao hàng", done: delivered, at: deliveredAt ?? undefined },
  ];

  const activeIdx = steps.reduce((acc, s, i) => (s.done ? i : acc), 0);

  return (
    <ol className="relative space-y-0">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;
        const isActive = i === activeIdx && step.done;
        return (
          <li key={step.label} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && (
              <span
                className={cn(
                  "absolute left-[7px] top-4 h-[calc(100%-4px)] w-0.5",
                  step.done ? "bg-sky-500" : "bg-slate-200",
                )}
              />
            )}
            <span className="relative z-[1] mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
              {step.done ? (
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full bg-sky-600",
                    isActive && "ring-4 ring-sky-100",
                  )}
                >
                  <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
                </span>
              ) : (
                <span className="h-3 w-3 rounded-full border-2 border-slate-200 bg-white" />
              )}
            </span>
            <div className="min-w-0 flex-1 pt-0">
              <p className={cn("text-sm font-medium", step.done ? "text-slate-800" : "text-slate-400")}>
                {step.label}
              </p>
              {step.at && step.done && (
                <p className="mt-0.5 text-xs text-slate-400">{fmt(step.at)}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function DeliveryPanel({
  productName,
  variantName,
  message,
  warrantyDays,
  warrantyHref,
}: {
  productName: string;
  variantName: string;
  message?: string | null;
  warrantyDays: number;
  warrantyHref?: string;
}) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const text = message?.trim() || "Đã giao. Liên hệ hỗ trợ nếu cần.";
  const masked = "•".repeat(Math.min(Math.max(text.length, 12), 48));

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ponytail: clipboard may fail on HTTP — user can still select text */
    }
  }

  return (
    <div className="rounded-2xl border border-sky-100 bg-sky-50/60 p-5">
      <p className="mb-1 text-sm font-semibold text-slate-800">
        {productName} — {variantName}
      </p>
      <p className="mb-4 text-xs leading-relaxed text-slate-500">
        Thông tin sản phẩm đã được giao. Vui lòng sao chép và bảo mật thông tin bên dưới.
      </p>
      <div className="relative rounded-xl border border-slate-200 bg-white p-4">
        <div className="absolute right-3 top-3 flex gap-1.5">
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:border-sky-300 hover:text-sky-700"
            aria-label={revealed ? "Ẩn thông tin" : "Hiện thông tin"}
          >
            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={copyAll}
            className="rounded-lg border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:border-sky-300 hover:text-sky-700"
            aria-label="Sao chép"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <pre className="whitespace-pre-wrap break-words pr-20 font-mono text-sm leading-relaxed text-slate-700">
          {revealed ? text : masked}
        </pre>
      </div>
      {warrantyDays > 0 && (
        <p className="mt-3 text-xs text-slate-500">Bảo hành: {warrantyDays} ngày kể từ khi giao hàng</p>
      )}
      {warrantyHref && (
        <Link
          href={warrantyHref}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-800"
        >
          <Headphones className="h-4 w-4" />
          Báo lỗi / Yêu cầu hỗ trợ
        </Link>
      )}
    </div>
  );
}

export function SupportCtaCard({ orderCode, itemId }: { orderCode: string; itemId: string }) {
  return (
    <OrderCard className="border-sky-100 bg-gradient-to-br from-sky-50/80 to-white">
      <div className="flex gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm">
          <Headphones className="h-5 w-5" />
        </span>
        <div>
          <p className="font-semibold text-slate-800">Cần hỗ trợ?</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-500">
            Tài khoản bị lỗi hoặc không thể đăng nhập?
          </p>
          <Link
            href={`/orders/${orderCode}/warranty?item=${itemId}`}
            className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300"
          >
            <KeyRound className="h-4 w-4" />
            Báo lỗi / Yêu cầu hỗ trợ
          </Link>
        </div>
      </div>
    </OrderCard>
  );
}

export function OrderListIcon() {
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-100 to-sky-50 text-sky-700">
      <Package className="h-5 w-5" />
    </span>
  );
}

export function OrderMetaLine({
  orderCode,
  createdAt,
  itemCount,
}: {
  orderCode: string;
  createdAt: string;
  itemCount: number;
}) {
  return (
    <p className="text-xs text-slate-400">
      #{orderCode} · {new Date(createdAt).toLocaleString("vi-VN")} · {itemCount} sản phẩm
    </p>
  );
}

export function OrderDetailLink({ href }: { href: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-0.5 text-sm font-semibold text-sky-700 hover:text-sky-900">
      Chi tiết
      <ChevronRight className="h-4 w-4" />
    </Link>
  );
}

export function PaymentMeta({ paymentStatus }: { paymentStatus: string }) {
  return (
    <span className="text-slate-500">
      Thanh toán: {PAYMENT_STATUS_LABEL[paymentStatus] ?? paymentStatus}
    </span>
  );
}

export function PrimaryButton({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(10,116,184,0.25)] transition hover:bg-sky-800",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function formatOrderTitle(orderCode: string) {
  return `Đơn hàng #${orderCode}`;
}
