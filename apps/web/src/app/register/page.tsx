"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, setToken, ApiError } from "@/lib/api";
import { FieldLabel, TextInput } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ accessToken: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, name: name || undefined }),
      });
      setToken(res.accessToken);
      router.push("/products");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Đăng ký thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel className="mx-auto max-w-md">
      <form onSubmit={submit} className="space-y-5">
        <StatusPill label="Auth" tone="info" />
        <div>
          <h1 className="mt-4 text-3xl font-semibold text-white">Tạo tài khoản</h1>
          <p className="mt-2 text-sm text-slate-300">Tạo tài khoản để thanh toán, theo dõi đơn và mở bảo hành sau này.</p>
        </div>
        <div>
          <FieldLabel>Tên hiển thị</FieldLabel>
          <TextInput placeholder="Tên (tuỳ chọn)" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <FieldLabel>Email</FieldLabel>
          <TextInput type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <FieldLabel>Mật khẩu</FieldLabel>
          <TextInput type="password" placeholder="Mật khẩu (>= 8 ký tự)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
        </div>
        {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        <button disabled={loading} className="button-primary w-full">
          {loading ? "..." : "Đăng ký"}
        </button>
        <p className="text-sm text-slate-400">
          Đã có tài khoản? <Link href="/login" className="text-cyan-300">Đăng nhập</Link>
        </p>
      </form>
    </Panel>
  );
}
