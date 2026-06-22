"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { Suspense, useState } from "react";
import { AuthField, AuthLink, AuthShell, AuthSubmitButton } from "@/components/auth/AuthShell";
import { apiFetch, setSession, ApiError } from "@/lib/api";

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
      const res = await apiFetch<{ accessToken: string; refreshToken: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setSession(res.accessToken, res.refreshToken);
      router.push(params.get("next") ?? "/orders");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Chào mừng trở lại"
      subtitle="Truy cập vào hệ sinh thái kỹ thuật số cao cấp của bạn"
      footer={
        <>
          Chưa có tài khoản? <AuthLink href="/register">Đăng ký ngay</AuthLink>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <AuthField
          id="login-email"
          label="Địa chỉ Email"
          type="email"
          autoComplete="email"
          placeholder="name@company.com"
          icon={<Mail className="h-4 w-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <AuthField
          id="login-password"
          label="Mật khẩu"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          icon={<Lock className="h-4 w-4" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          labelExtra={
            <Link href="/forgot-password" className="text-xs font-medium text-[var(--cynex-primary)] hover:underline">
              Quên mật khẩu?
            </Link>
          }
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <AuthSubmitButton loading={loading}>
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </AuthSubmitButton>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
