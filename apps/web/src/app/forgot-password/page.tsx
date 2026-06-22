"use client";

import { ArrowLeft, Mail } from "lucide-react";
import { useState } from "react";
import { AuthField, AuthLink, AuthShell, AuthSubmitButton } from "@/components/auth/AuthShell";
import { apiFetch } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await apiFetch("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setLoading(false);
    setDone(true);
  }

  return (
    <AuthShell
      title="Quên mật khẩu"
      subtitle="Nhập email đã đăng ký — chúng tôi sẽ gửi link đặt lại mật khẩu."
      footer={
        <>
          <AuthLink href="/login">
            <span className="inline-flex items-center gap-1.5">
              <ArrowLeft className="h-3.5 w-3.5" />
              Quay lại đăng nhập
            </span>
          </AuthLink>
        </>
      }
    >
      {done ? (
        <p className="text-sm leading-relaxed text-slate-600">
          Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (kể cả thư rác).
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <AuthField
            id="forgot-email"
            label="Địa chỉ Email"
            type="email"
            autoComplete="email"
            placeholder="name@company.com"
            icon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <AuthSubmitButton loading={loading}>{loading ? "Đang gửi..." : "Gửi link đặt lại"}</AuthSubmitButton>
        </form>
      )}
    </AuthShell>
  );
}
