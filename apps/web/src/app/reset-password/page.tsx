"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { apiFetch, ApiError } from "@/lib/api";
import { FieldLabel, TextInput } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

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
    <Panel className="mx-auto max-w-md">
      <form onSubmit={submit} className="space-y-5">
        <StatusPill label="Recovery" tone={token ? "info" : "danger"} />
        <div>
          <h1 className="mt-4 text-3xl font-semibold text-white">Đặt lại mật khẩu</h1>
          {!token ? <p className="mt-2 text-sm text-rose-300">Thiếu token.</p> : <p className="mt-2 text-sm text-slate-300">Chọn mật khẩu mới cho tài khoản Cynex của bạn.</p>}
        </div>
        <div>
          <FieldLabel>Mật khẩu mới</FieldLabel>
          <TextInput type="password" placeholder="Mật khẩu mới" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </div>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <button className="button-primary w-full">Đặt lại</button>
      </form>
    </Panel>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
