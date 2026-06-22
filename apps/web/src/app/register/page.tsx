"use client";

import { Lock, Mail, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthField, AuthLink, AuthShell, AuthSubmitButton } from "@/components/auth/AuthShell";
import { apiFetch, setSession, ApiError } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldError(null);

    if (password !== confirmPassword) {
      setFieldError("Mật khẩu xác nhận không khớp");
      return;
    }
    if (!acceptedTerms) {
      setError("Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch<{ accessToken: string; refreshToken: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, name: name.trim() || undefined }),
      });
      setSession(res.accessToken, res.refreshToken);
      router.push("/products");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Tạo tài khoản mới"
      subtitle="Trải nghiệm nền tảng dịch vụ kỹ thuật số cao cấp cùng Cynex."
      footer={
        <>
          Bạn đã có tài khoản? <AuthLink href="/login">Đăng nhập ngay</AuthLink>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <AuthField
          id="register-name"
          label="Họ và tên"
          type="text"
          autoComplete="name"
          placeholder="Nguyễn Văn A (tuỳ chọn)"
          icon={<User className="h-4 w-4" />}
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
        />

        <AuthField
          id="register-email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="example@cynex.vn"
          icon={<Mail className="h-4 w-4" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <AuthField
          id="register-password"
          label="Mật khẩu"
          type="password"
          autoComplete="new-password"
          placeholder="Tối thiểu 8 ký tự"
          icon={<Lock className="h-4 w-4" />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          maxLength={72}
        />

        <AuthField
          id="register-confirm-password"
          label="Xác nhận mật khẩu"
          type="password"
          autoComplete="new-password"
          placeholder="Nhập lại mật khẩu"
          icon={<ShieldCheck className="h-4 w-4" />}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          error={fieldError ?? undefined}
        />

        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-slate-600">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[var(--cynex-primary)] focus:ring-sky-200"
          />
          <span>
            Tôi đồng ý với{" "}
            <Link href="/terms" className="font-semibold text-[var(--cynex-primary)] hover:underline">
              Điều khoản dịch vụ
            </Link>{" "}
            và{" "}
            <Link href="/privacy" className="font-semibold text-[var(--cynex-primary)] hover:underline">
              Chính sách bảo mật
            </Link>{" "}
            của Cynex.
          </span>
        </label>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        )}

        <AuthSubmitButton loading={loading}>{loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}</AuthSubmitButton>
      </form>
    </AuthShell>
  );
}
