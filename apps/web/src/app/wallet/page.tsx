"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, getToken, ApiError } from "@/lib/api";
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

  if (balance === null) return <p>Đang tải...</p>;

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-xl border bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white">
        <p className="text-indigo-100">Số dư ví</p>
        <p className="mt-1 text-3xl font-bold">{formatVnd(balance)}</p>
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-3 font-bold">Nạp tiền (payOS)</h2>
        <div className="flex gap-2">
          <input
            type="number"
            min={1000}
            step={1000}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-40 rounded-lg border px-3 py-2"
          />
          <button onClick={deposit} className="rounded-lg bg-brand px-4 py-2 font-medium text-white">
            Nạp tiền
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      <div className="rounded-xl border bg-white p-6">
        <h2 className="mb-3 font-bold">Lịch sử giao dịch</h2>
        <ul className="divide-y text-sm">
          {txns.map((t) => (
            <li key={t.id} className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">{TYPE_LABEL[t.type] ?? t.type}</p>
                <p className="text-xs text-slate-500">
                  {new Date(t.createdAt).toLocaleString("vi-VN")}
                  {t.description ? ` · ${t.description}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className={t.amount >= 0 ? "font-bold text-green-600" : "font-bold text-red-600"}>
                  {t.amount >= 0 ? "+" : ""}
                  {formatVnd(t.amount)}
                </p>
                <p className="text-xs text-slate-500">{formatVnd(t.balanceAfter)}</p>
              </div>
            </li>
          ))}
          {txns.length === 0 && <li className="py-2 text-slate-500">Chưa có giao dịch.</li>}
        </ul>
      </div>
    </section>
  );
}
