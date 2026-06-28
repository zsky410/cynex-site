"use client";

import { Copy, TimerReset } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { formatVnd } from "@/lib/utils";

export interface BankTransferPayment {
  paymentCode: string;
  amount: number;
  qrCode: string;
  bankName: string;
  bankAccount: string;
  accountHolder: string;
  transferContent: string;
  expiredAt?: string | null;
}

export function BankTransferInstructions({
  payment,
  title = "Thông tin chuyển khoản",
  onExpired,
}: {
  payment: BankTransferPayment;
  title?: string;
  onExpired?: () => void;
}) {
  const expiresAtMs = useMemo(() => (payment.expiredAt ? new Date(payment.expiredAt).getTime() : null), [payment.expiredAt]);
  const [remainingMs, setRemainingMs] = useState(() => (expiresAtMs ? Math.max(0, expiresAtMs - Date.now()) : null));

  useEffect(() => {
    if (!expiresAtMs) return;

    let didNotify = false;
    const tick = () => {
      const next = Math.max(0, expiresAtMs - Date.now());
      setRemainingMs(next);
      if (next === 0 && !didNotify) {
        didNotify = true;
        onExpired?.();
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAtMs, onExpired]);

  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
  }

  const countdown = remainingMs == null ? null : formatRemainingTime(remainingMs);
  const expired = remainingMs === 0;

  return (
    <section className="rounded-[32px] border border-sky-100/80 bg-white/82 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.07)] backdrop-blur sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200/70 pb-5">
        <div className="min-w-0">
          <h3 className="text-[24px] font-semibold tracking-[-0.03em] text-slate-950">{title}</h3>
          <p className="mt-2 text-sm leading-7 text-slate-500">
            Quét QR hoặc chuyển khoản đúng nội dung để hệ thống tự xác nhận.
          </p>
        </div>
        {countdown ? (
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold ${
              expired
                ? "border-rose-200 bg-rose-50 text-rose-700"
                : "border-sky-200 bg-sky-50 text-sky-700"
            }`}
          >
            <TimerReset className="h-3.5 w-3.5" />
            {expired ? "Đã hết hạn" : `Còn ${countdown}`}
          </span>
        ) : null}
      </div>

      <div className="grid gap-7 pt-6 lg:grid-cols-[minmax(280px,0.92fr)_minmax(320px,1.08fr)] lg:items-center">
        <div className="flex items-center justify-center rounded-[28px] border border-white bg-[radial-gradient(circle_at_50%_20%,rgba(14,165,233,0.12),transparent_38%),linear-gradient(180deg,#f8fbff_0%,#edf6ff_100%)] p-5 shadow-inner">
          <img
            src={payment.qrCode}
            alt={`QR thanh toán ${payment.paymentCode}`}
            className="aspect-square w-full max-w-[360px] rounded-2xl object-contain"
          />
        </div>

        <div className="min-w-0 divide-y divide-slate-200/70 rounded-[24px] border border-slate-200/70 bg-white/70 px-5 text-slate-700">
          <div className="grid gap-2 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400">Ngân hàng</p>
            <p className="text-[15px] font-medium text-slate-900">{payment.bankName}</p>
          </div>

          <div className="grid gap-2 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400">Số tài khoản</p>
            <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="min-w-0 max-w-full break-words text-[15px] font-medium tracking-[-0.01em] text-slate-900">
                {payment.bankAccount}
              </p>
              <button
                type="button"
                onClick={() => copy(payment.bankAccount)}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-medium text-slate-700"
              >
                <Copy className="h-4 w-4" />
                Sao chép
              </button>
            </div>
          </div>

          <div className="grid gap-2 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400">Chủ tài khoản</p>
            <p className="break-words text-[15px] font-medium text-slate-900">{payment.accountHolder}</p>
          </div>

          <div className="grid gap-2 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400">Số tiền</p>
            <p className="text-[15px] font-medium tracking-[-0.01em] text-slate-900">{formatVnd(payment.amount)}</p>
          </div>

          <div className="grid gap-2 py-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-400">Nội dung chuyển khoản</p>
            <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="min-w-0 max-w-full break-words text-[15px] font-medium tracking-[-0.01em] text-slate-900">
                {payment.transferContent}
              </p>
              <button
                type="button"
                onClick={() => copy(payment.transferContent)}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-[13px] font-medium text-slate-700"
              >
                <Copy className="h-4 w-4" />
                Sao chép
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function formatRemainingTime(ms: number) {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}
