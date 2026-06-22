"use client";

import Link from "next/link";
import { Eye, EyeOff, LayoutGrid } from "lucide-react";
import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <Link href="/" className="mb-8 flex items-center gap-2.5 transition hover:opacity-80">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 shadow-sm">
          <LayoutGrid className="h-5 w-5" strokeWidth={2.3} />
        </span>
        <span className="text-xl font-bold tracking-[-0.04em] text-sky-950">CYNEX</span>
      </Link>

      <div className="mb-6 max-w-md text-center">
        <h1 className="section-title text-[26px] font-semibold text-slate-900 sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-2 text-sm leading-relaxed text-slate-500">{subtitle}</p>}
      </div>

      <div className="w-full max-w-[420px] rounded-[24px] border border-slate-200/80 bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,0.08)] sm:p-8">
        {children}
      </div>

      {footer && <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>}

      <p className="mt-10 max-w-md text-center text-xs leading-relaxed text-slate-400">
        © {new Date().getFullYear()} CYNEX. Hệ sinh thái dịch vụ kỹ thuật số cao cấp.
        <br />
        Bảo mật thông tin là ưu tiên hàng đầu của chúng tôi.
      </p>
    </div>
  );
}

type AuthFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "className"> & {
  label: ReactNode;
  icon: ReactNode;
  labelExtra?: ReactNode;
  error?: string;
};

export function AuthField({ label, icon, labelExtra, error, type, ...props }: AuthFieldProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPassword ? "text" : type;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={props.id} className="text-[13px] font-medium text-slate-600">
          {label}
        </label>
        {labelExtra}
      </div>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        <input
          {...props}
          type={inputType}
          className={cn(
            "w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 text-sm text-slate-900 outline-none transition",
            "placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-100",
            isPassword ? "pr-10" : "pr-3.5",
            error && "border-red-300 focus:border-red-400 focus:ring-red-100",
          )}
        />
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function AuthSubmitButton({
  children,
  loading,
}: {
  children: ReactNode;
  loading?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--cynex-primary)] py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(10,116,184,0.28)] transition hover:bg-[var(--cynex-primary-deep)] disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function AuthLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-[var(--cynex-primary)] transition hover:text-[var(--cynex-primary-deep)]">
      {children}
    </Link>
  );
}
