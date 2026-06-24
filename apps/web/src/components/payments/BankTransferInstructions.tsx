"use client";

import { CheckCircle2, Copy } from "lucide-react";
import { formatVnd } from "@/lib/utils";

export interface BankTransferPayment {
  paymentCode: string;
  amount: number;
  qrCode: string;
  bankName: string;
  bankAccount: string;
  accountHolder: string;
  transferContent: string;
}

export function BankTransferInstructions({
  payment,
  title = "Thông tin chuyển khoản",
}: {
  payment: BankTransferPayment;
  title?: string;
}) {
  async function copy(value: string) {
    await navigator.clipboard.writeText(value);
  }

  return (
    <section className="rounded-[24px] border border-sky-100 bg-sky-50/70 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-sky-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">
            Quét QR hoặc chuyển khoản đúng nội dung để hệ thống tự xác nhận.
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Mã mới
        </span>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-[220px_1fr]">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <img
            src={payment.qrCode}
            alt={`QR thanh toán ${payment.paymentCode}`}
            className="h-full w-full rounded-xl object-contain"
          />
        </div>

        <div className="space-y-3 text-sm text-slate-700">
          <p>
            <span className="font-semibold">Ngân hàng:</span> {payment.bankName}
          </p>
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Số tài khoản</p>
              <p className="mt-1 font-mono text-base font-semibold text-slate-950">{payment.bankAccount}</p>
            </div>
            <button
              type="button"
              onClick={() => copy(payment.bankAccount)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
            >
              <Copy className="h-4 w-4" />
              Sao chép
            </button>
          </div>
          <p>
            <span className="font-semibold">Chủ tài khoản:</span> {payment.accountHolder}
          </p>
          <p>
            <span className="font-semibold">Số tiền:</span> {formatVnd(payment.amount)}
          </p>
          <div className="rounded-2xl bg-white p-4">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Nội dung chuyển khoản</p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="font-mono text-base font-semibold text-slate-950">{payment.transferContent}</p>
              <button
                type="button"
                onClick={() => copy(payment.transferContent)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700"
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
