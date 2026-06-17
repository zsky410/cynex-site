"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch, setToken, ApiError } from "@/lib/api";

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
    <form onSubmit={submit} className="mx-auto max-w-sm space-y-4 rounded-xl border bg-white p-6">
      <h1 className="text-xl font-bold">Tạo tài khoản</h1>
      <input className="w-full rounded-lg border px-3 py-2" placeholder="Tên (tuỳ chọn)"
        value={name} onChange={(e) => setName(e.target.value)} />
      <input className="w-full rounded-lg border px-3 py-2" type="email" placeholder="Email"
        value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input className="w-full rounded-lg border px-3 py-2" type="password" placeholder="Mật khẩu (>= 8 ký tự)"
        value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={loading} className="w-full rounded-lg bg-brand py-2.5 font-medium text-white disabled:opacity-50">
        {loading ? "..." : "Đăng ký"}
      </button>
      <p className="text-sm text-slate-500">
        Đã có tài khoản? <Link href="/login" className="text-brand">Đăng nhập</Link>
      </p>
    </form>
  );
}
