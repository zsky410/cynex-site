"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";

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
      <div className="mx-auto max-w-sm rounded-xl border bg-white p-6">
        <p>Nếu email tồn tại, chúng tôi đã gửi link đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-4 rounded-xl border bg-white p-6">
      <h1 className="text-xl font-bold">Quên mật khẩu</h1>
      <input className="w-full rounded-lg border px-3 py-2" type="email" placeholder="Email"
        value={email} onChange={(e) => setEmail(e.target.value)} required />
      <button className="w-full rounded-lg bg-brand py-2.5 font-medium text-white">Gửi link</button>
    </form>
  );
}
