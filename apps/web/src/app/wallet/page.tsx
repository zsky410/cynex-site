"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownLeft, ArrowUpRight, CreditCard, WalletCards } from "lucide-react";
import { apiFetch, getToken, ApiError } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldLabel, TextInput } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import { SectionHeader } from "@/components/ui/section-header";
import { formatVnd } from "@/lib/utils";

interface Txn {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description?: string | null;
  createdAt: string;
}

const TYPE_LABEL: Record<string, string> = {
  deposit: "Nạp tiền",
  purchase: "Mua hàng",
  refund: "Hoàn tiền",
  admin_adjustment: "Điều chỉnh",
};

export default function WalletPage() {
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [amount, setAmount] = useState(50000);
  const [error, setError] = useState<string | null>(null);

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
    try {
      const res = await apiFetch<{ checkoutUrl: string }>("/wallet/deposit", {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
      window.location.href = res.checkoutUrl;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Không tạo được giao dịch nạp");
    }
  }

  if (balance === null) return <p className="text-sm text-slate-300">Đang tải ví...</p>;

  return (
    <section className="space-y-6">
      <SectionHeader
        eyebrow="Wallet"
        title="Quản lý số dư và giao dịch Cynex"
        description="Nạp tiền nhanh để thanh toán nội bộ, đồng thời giữ lại lịch sử biến động ví theo cách dễ đọc."
      />

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.24),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.16),transparent_24%)]" />
          <div className="relative">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-slate-300">
              <WalletCards className="size-4 text-cyan-300" />
              Số dư hiện tại
            </div>
            <p className="mt-6 text-4xl font-semibold text-white md:text-5xl">{formatVnd(balance)}</p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">
              Ví Cynex phù hợp cho các lần mua lặp lại hoặc hoàn tiền nội bộ.
            </p>
          </div>
        </Panel>

        <Panel className="space-y-4">
          <div>
            <FieldLabel hint="payOS">Nạp tiền vào ví</FieldLabel>
            <div className="flex flex-col gap-3 md:flex-row">
              <TextInput
                type="number"
                min={1000}
                step={1000}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="md:max-w-xs"
              />
              <button onClick={deposit} className="button-primary md:w-auto">
                <CreditCard className="size-4" />
                Nạp tiền
              </button>
            </div>
          </div>
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4 text-sm leading-6 text-slate-300">
            Sau khi thanh toán thành công, số dư ví sẽ được cộng vào tài khoản để dùng cho đơn hàng kế tiếp hoặc hoàn tiền.
          </div>
        </Panel>
      </div>

      <Panel className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-2xl font-semibold text-white">Lịch sử giao dịch</h2>
        </div>
        {txns.length ? (
          <ul className="space-y-3">
            {txns.map((t) => (
              <li key={t.id} className="flex flex-col gap-3 rounded-[22px] border border-white/8 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between">
                <div className="inline-flex items-start gap-3">
                  <span className={`rounded-full p-2 ${t.amount >= 0 ? "bg-emerald-400/10" : "bg-rose-400/10"}`}>
                    {t.amount >= 0 ? (
                      <ArrowDownLeft className="size-4 text-emerald-300" />
                    ) : (
                      <ArrowUpRight className="size-4 text-rose-300" />
                    )}
                  </span>
                  <div>
                    <p className="font-medium text-white">{TYPE_LABEL[t.type] ?? t.type}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(t.createdAt).toLocaleString("vi-VN")}
                      {t.description ? ` · ${t.description}` : ""}
                    </p>
                  </div>
                </div>
                <div className="text-left md:text-right">
                  <p className={t.amount >= 0 ? "font-semibold text-emerald-300" : "font-semibold text-rose-300"}>
                    {t.amount >= 0 ? "+" : ""}
                    {formatVnd(t.amount)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Số dư sau giao dịch: {formatVnd(t.balanceAfter)}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            title="Chưa có giao dịch nào"
            description="Khi bạn nạp tiền, mua hàng hoặc nhận hoàn tiền, các biến động ví sẽ xuất hiện tại đây."
          />
        )}
      </Panel>
    </section>
  );
}
