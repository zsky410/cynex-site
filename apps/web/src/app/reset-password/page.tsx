"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      router.push("/login");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Không thể đặt lại mật khẩu");
    }
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-4 rounded-xl border bg-white p-6">
      <h1 className="text-xl font-bold">Đặt lại mật khẩu</h1>
      {!token && <p className="text-sm text-red-600">Thiếu token.</p>}
      <input className="w-full rounded-lg border px-3 py-2" type="password" placeholder="Mật khẩu mới"
        value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button className="w-full rounded-lg bg-brand py-2.5 font-medium text-white">Đặt lại</button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
