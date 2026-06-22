"use client";

import { useState } from "react";
import { AuthField } from "@/components/auth/AuthShell";
import { Lock } from "lucide-react";
import { apiFetch, ApiError } from "@/lib/api";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (newPassword !== confirm) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    setBusy(true);
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Không đổi được mật khẩu");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-4 border-t border-slate-100 pt-5">
      <p className="text-sm font-medium text-slate-800">Đổi mật khẩu</p>
      <AuthField
        id="current-password"
        label="Mật khẩu hiện tại"
        type="password"
        autoComplete="current-password"
        icon={<Lock className="h-4 w-4" />}
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        required
      />
      <AuthField
        id="new-password"
        label="Mật khẩu mới"
        type="password"
        autoComplete="new-password"
        icon={<Lock className="h-4 w-4" />}
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        required
        minLength={8}
      />
      <AuthField
        id="confirm-password"
        label="Xác nhận mật khẩu mới"
        type="password"
        autoComplete="new-password"
        icon={<Lock className="h-4 w-4" />}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        required
        minLength={8}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-emerald-700">Đã cập nhật mật khẩu.</p>}
      <button
        type="submit"
        disabled={busy}
        className="rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {busy ? "Đang lưu..." : "Cập nhật mật khẩu"}
      </button>
    </form>
  );
}
