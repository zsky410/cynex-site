"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { apiFetch, setToken, ApiError } from "@/lib/api";
import { FieldLabel, TextInput } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ accessToken: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setToken(res.accessToken);
      router.push(params.get("next") ?? "/orders");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel className="mx-auto max-w-md">
      <form onSubmit={submit} className="space-y-5">
        <StatusPill label="Auth" tone="info" />
        <div>
          <h1 className="mt-4 text-3xl font-semibold text-white">Đăng nhập</h1>
          <p className="mt-2 text-sm text-slate-300">Theo dõi đơn, ví và hỗ trợ trong cùng tài khoản Cynex.</p>
        </div>
        <div>
          <FieldLabel>Email</FieldLabel>
          <TextInput type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <FieldLabel>Mật khẩu</FieldLabel>
          <TextInput type="password" placeholder="Mật khẩu" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <button disabled={loading} className="button-primary w-full">
          {loading ? "..." : "Đăng nhập"}
        </button>
        <div className="flex justify-between text-sm text-slate-400">
          <Link href="/register">Tạo tài khoản</Link>
          <Link href="/forgot-password">Quên mật khẩu?</Link>
        </div>
      </form>
    </Panel>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
