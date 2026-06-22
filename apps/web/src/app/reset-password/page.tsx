"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import { Suspense, useState } from "react";
import { AuthField, AuthLink, AuthShell, AuthSubmitButton } from "@/components/auth/AuthShell";
import { apiFetch, ApiError } from "@/lib/api";

function ResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    setLoading(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      router.push("/login");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Không thể đặt lại mật khẩu");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Đặt lại mật khẩu"
      subtitle="Nhập mật khẩu mới cho tài khoản Cynex của bạn"
      footer={
        <>
          Nhớ mật khẩu? <AuthLink href="/login">Đăng nhập</AuthLink>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        {!token && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Liên kết không hợp lệ. Vui lòng yêu cầu{" "}
            <Link href="/forgot-password" className="font-semibold text-sky-700 hover:underline">
              gửi lại email
            </Link>
            .
          </p>
        )}
        <AuthField
          id="reset-password"
          label="Mật khẩu mới"
          type="password"
          autoComplete="new-password"
          placeholder="Tối thiểu 8 ký tự"
          icon={<Lock className="h-4 w-4" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          disabled={!token}
        />
        <AuthField
          id="reset-confirm"
          label="Xác nhận mật khẩu"
          type="password"
          autoComplete="new-password"
          placeholder="Nhập lại mật khẩu"
          icon={<Lock className="h-4 w-4" />}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={8}
          disabled={!token}
        />
        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}
        <AuthSubmitButton loading={loading}>
          {loading ? "Đang lưu..." : "Đặt lại mật khẩu"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </AuthSubmitButton>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetForm />
    </Suspense>
  );
}
