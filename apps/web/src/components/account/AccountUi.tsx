"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Headphones,
  LogOut,
  Package,
  Shield,
  UserRound,
  WalletCards,
} from "lucide-react";
import { PremiumFooter, PremiumHeader } from "@/components/storefront/PremiumChrome";
import { clearToken, apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";

export function AccountPageLayout({
  activeKey,
  title,
  subtitle,
  children,
}: {
  activeKey?: "wallet";
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="home-shell min-h-screen">
      <PremiumHeader activeKey={activeKey ?? undefined} />
      <main className="mx-auto max-w-[1180px] px-5 pb-20 pt-8 lg:px-8 lg:pt-10">
        <div className="mb-8">
          <h1 className="section-title text-3xl font-semibold tracking-[-0.03em] text-slate-950 lg:text-4xl">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-sm text-slate-500">{subtitle}</p>}
        </div>
        {children}
      </main>
      <PremiumFooter />
    </div>
  );
}

export function AccountCard({
  id,
  className,
  children,
}: {
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn(
        "rounded-[20px] border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function AccountSectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ProfileAvatar({ name, email }: { name?: string | null; email: string }) {
  const initials = (() => {
    if (name?.trim()) {
      return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0])
        .join("")
        .toUpperCase();
    }
    return email[0]?.toUpperCase() ?? "?";
  })();

  return (
    <div className="flex flex-col items-center gap-3 sm:items-start">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-sky-700 text-2xl font-bold text-white shadow-[0_12px_30px_rgba(10,116,184,0.3)]">
        {initials}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Thành viên hoạt động
      </span>
    </div>
  );
}

export function InfoField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

const QUICK_LINKS = [
  { href: "/orders", icon: Package, label: "Đơn hàng", desc: "Xem lịch sử mua hàng" },
  { href: "/wallet", icon: WalletCards, label: "Ví của tôi", desc: "Nạp tiền và giao dịch" },
  { href: "/warranty", icon: Headphones, label: "Hỗ trợ", desc: "Yêu cầu hỗ trợ & bảo hành" },
] as const;

export function QuickAccessCard() {
  return (
    <AccountCard>
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-[0.14em] text-slate-400">Truy cập nhanh</h2>
      <ul className="space-y-1">
        {QUICK_LINKS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="flex items-center gap-3 rounded-xl px-2 py-3 transition hover:bg-slate-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <item.icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
            </Link>
          </li>
        ))}
      </ul>
    </AccountCard>
  );
}

export function LogoutCard() {
  const router = useRouter();

  async function logout() {
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    clearToken();
    router.push("/login");
  }

  return (
    <AccountCard>
      <div className="mb-4 flex items-center gap-2">
        <LogOut className="h-4 w-4 text-red-500" />
        <h2 className="text-sm font-semibold text-slate-800">Phiên đăng nhập</h2>
      </div>
      <p className="text-sm text-slate-500">Đăng xuất an toàn khỏi tài khoản trên thiết bị này.</p>
      <button
        type="button"
        onClick={logout}
        className="mt-4 w-full rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
      >
        Đăng xuất
      </button>
    </AccountCard>
  );
}

export function SecurityRow({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof Shield;
  title: string;
  description: string;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 border-t border-slate-100 py-5 first:border-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="font-medium text-slate-800">{title}</p>
          <p className="mt-0.5 text-sm text-slate-500">{description}</p>
        </div>
      </div>
      <div className="shrink-0 sm:ml-4">{action}</div>
    </div>
  );
}

export function OutlineButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-300 hover:text-sky-800"
    >
      {children}
    </Link>
  );
}

export function UserBadge({ email }: { email: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-slate-500">
      <UserRound className="h-4 w-4" />
      {email}
    </span>
  );
}
