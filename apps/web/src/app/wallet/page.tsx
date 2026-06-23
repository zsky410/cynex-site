"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Plus,
  RefreshCw,
  ShoppingCart,
  Wallet,
} from "lucide-react";
import { AccountCard, AccountPageLayout } from "@/components/account/AccountUi";
import {
  BankTransferInstructions,
  type BankTransferPayment,
} from "@/components/payments/BankTransferInstructions";
import { apiFetch, getToken, ApiError } from "@/lib/api";
import { formatWalletTxnTimeVN } from "@/lib/date-time";
import { WALLET_PRESET_AMOUNTS, WALLET_TXN_TYPE_LABEL } from "@/lib/wallet";
import { cn, formatVnd } from "@/lib/utils";

interface Txn {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description?: string | null;
  createdAt: string;
}

function txnIcon(type: string) {
  switch (type) {
    case "deposit":
      return { Icon: ArrowDownLeft, className: "bg-sky-100 text-sky-700" };
    case "purchase":
      return { Icon: ShoppingCart, className: "bg-slate-100 text-slate-600" };
    case "refund":
      return { Icon: RefreshCw, className: "bg-emerald-100 text-emerald-700" };
    default:
      return { Icon: ArrowUpRight, className: "bg-violet-100 text-violet-700" };
  }
}

export default function WalletPage() {
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [amount, setAmount] = useState<number>(100_000);
  const [customAmount, setCustomAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [depositPayment, setDepositPayment] = useState<BankTransferPayment | null>(null);

  const depositAmount = useMemo(() => {
    const parsed = Number(customAmount.replace(/\D/g, ""));
    if (customAmount.trim() && parsed >= 1000) return parsed;
    return amount;
  }, [amount, customAmount]);

  async function load() {
    const b = await apiFetch<{ balance: number }>("/wallet");
    setBalance(b.balance);
    setTxns(await apiFetch<Txn[]>("/wallet/transactions"));
  }

  useEffect(() => {
    if (!getToken()) {
      router.push("/login?next=/wallet");
      return;
    }
    load().catch((e) => {
      if (e instanceof ApiError && e.status === 401) router.push("/login?next=/wallet");
    });
  }, [router]);

  async function deposit() {
    setError(null);
    setBusy(true);
    try {
      const res = await apiFetch<BankTransferPayment>("/wallet/deposit", {
        method: "POST",
        body: JSON.stringify({ amount: depositAmount }),
      });
      setDepositPayment(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Không tạo được giao dịch nạp");
    } finally {
      setBusy(false);
    }
  }

  if (balance === null) {
    return (
      <AccountPageLayout activeKey="wallet" title="Ví của tôi" subtitle="Đang tải...">
        <div className="h-64 animate-pulse rounded-[20px] bg-white/60" />
      </AccountPageLayout>
    );
  }

  return (
    <AccountPageLayout
      activeKey="wallet"
      title="Ví của tôi"
      subtitle="Nạp tiền và theo dõi giao dịch thanh toán qua Ví Cynex."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          <section className="overflow-hidden rounded-[24px] bg-gradient-to-br from-sky-600 via-sky-700 to-cyan-800 p-7 text-white shadow-[0_20px_50px_rgba(10,116,184,0.35)]">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-sky-100">Số dư hiện tại</p>
                <p className="mt-2 text-4xl font-bold tracking-tight">{formatVnd(balance)}</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                <Wallet className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#nap-tien"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-sky-800 transition hover:bg-sky-50"
              >
                <Plus className="h-4 w-4" />
                Nạp thêm
              </a>
              <a
                href="#lich-su"
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25"
              >
                <History className="h-4 w-4" />
                Lịch sử
              </a>
            </div>
          </section>

          <AccountCard id="nap-tien">
            <h2 className="text-lg font-semibold text-sky-900">Nạp tiền nhanh</h2>
            <p className="mt-1 text-sm text-slate-500">
              Quét QR SePay hoặc chuyển khoản đúng nội dung - tối thiểu 1.000đ
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {WALLET_PRESET_AMOUNTS.map((preset) => {
                const selected = !customAmount && amount === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setAmount(preset);
                      setCustomAmount("");
                    }}
                    className={cn(
                      "rounded-xl border px-3 py-3 text-sm font-semibold transition",
                      selected
                        ? "border-sky-500 bg-sky-50 text-sky-800 ring-2 ring-sky-100"
                        : "border-slate-200 text-slate-700 hover:border-sky-300",
                    )}
                  >
                    {formatVnd(preset)}
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <label htmlFor="custom-amount" className="mb-1.5 block text-sm font-medium text-slate-700">
                Nhập số tiền khác
              </label>
              <div className="flex overflow-hidden rounded-xl border border-slate-200 focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
                <input
                  id="custom-amount"
                  inputMode="numeric"
                  placeholder="Ví dụ: 150000"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value.replace(/[^\d]/g, ""))}
                  className="min-w-0 flex-1 px-3.5 py-2.5 text-sm outline-none"
                />
                <span className="flex items-center border-l border-slate-200 bg-slate-50 px-3 text-sm text-slate-500">
                  VND
                </span>
              </div>
            </div>

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}

            <button
              type="button"
              disabled={busy || depositAmount < 1000}
              onClick={deposit}
              className="mt-5 w-full rounded-xl bg-sky-700 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(10,116,184,0.28)] transition hover:bg-sky-800 disabled:opacity-60"
            >
              {busy ? "Đang tạo mã QR..." : `Tạo QR nạp ${formatVnd(depositAmount)}`}
            </button>

            {depositPayment ? (
              <div className="mt-5">
                <BankTransferInstructions payment={depositPayment} title="Thông tin nạp tiền" />
              </div>
            ) : null}
          </AccountCard>
        </div>

        <AccountCard id="lich-su" className="lg:row-span-2">
          <div className="mb-5 flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Lịch sử giao dịch</h2>
            <Link href="/profile" className="text-xs font-medium text-sky-700 hover:underline">
              Tài khoản →
            </Link>
          </div>

          <ul className="divide-y divide-slate-100">
            {txns.map((t) => {
              const { Icon, className } = txnIcon(t.type);
              const positive = t.amount >= 0;
              return (
                <li key={t.id} className="flex gap-3 py-4 first:pt-0">
                  <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", className)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {WALLET_TXN_TYPE_LABEL[t.type] ?? t.type}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">{formatWalletTxnTimeVN(t.createdAt)}</p>
                    {t.description && (
                      <p className="mt-1 truncate text-xs text-slate-500">{t.description}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={cn("text-sm font-bold", positive ? "text-sky-700" : "text-slate-900")}>
                      {positive ? "+" : ""}
                      {formatVnd(t.amount)}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">Ví Cynex</p>
                  </div>
                </li>
              );
            })}
            {txns.length === 0 && (
              <li className="py-8 text-center text-sm text-slate-500">Chưa có giao dịch nào.</li>
            )}
          </ul>
        </AccountCard>
      </div>
    </AccountPageLayout>
  );
}
