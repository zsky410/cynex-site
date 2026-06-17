"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { FieldLabel, TextInput } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setDone(true);
  }

  if (done) {
    return (
      <Panel className="mx-auto max-w-md">
        <StatusPill label="Recovery" tone="success" />
        <p className="mt-4 text-sm leading-6 text-slate-200">
          Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.
        </p>
      </Panel>
    );
  }

  return (
    <Panel className="mx-auto max-w-md">
      <form onSubmit={submit} className="space-y-5">
        <StatusPill label="Recovery" tone="info" />
        <div>
          <h1 className="mt-4 text-3xl font-semibold text-white">Quên mật khẩu</h1>
          <p className="mt-2 text-sm text-slate-300">Nhập email để nhận link đặt lại mật khẩu.</p>
        </div>
        <div>
          <FieldLabel>Email</FieldLabel>
          <TextInput type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <button className="button-primary w-full">Gửi link</button>
      </form>
    </Panel>
  );
}
