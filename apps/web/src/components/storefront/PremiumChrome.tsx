"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, LogOut, Menu, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { apiFetch, clearToken, getToken } from "@/lib/api";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/products", label: "Sản phẩm", key: "products" },
  { href: "/guide", label: "Hướng dẫn", key: "guide" },
  { href: "/orders", label: "Đơn hàng", key: "orders" },
  { href: "/wallet", label: "Ví của tôi", key: "wallet" },
  { href: "/warranty", label: "Hỗ trợ", key: "support" },
];

const footerColumns = [
  {
    title: "Khám phá",
    links: [
      { href: "/guide", label: "Về chúng tôi" },
      { href: "/products", label: "Sản phẩm" },
      { href: "/guide", label: "Hướng dẫn mua hàng" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { href: "/warranty", label: "Hỗ trợ khách hàng" },
      { href: "/guide", label: "Hướng dẫn mua hàng" },
      { href: "/warranty", label: "Chính sách bảo hành" },
    ],
  },
  {
    title: "Quản lý",
    links: [
      { href: "/profile", label: "Tài khoản cá nhân" },
      { href: "/wallet", label: "Ví Cynex Pay" },
      { href: "/orders", label: "Lịch sử đơn hàng" },
    ],
  },
];

interface SessionUser {
  email: string;
  name?: string | null;
}

function userInitials(user: SessionUser): string {
  if (user.name?.trim()) {
    return user.name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0])
      .join("")
      .toUpperCase();
  }
  return user.email[0]?.toUpperCase() ?? "?";
}

export function PremiumHeader({ activeKey }: { activeKey?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!getToken()) {
      setUser(null);
      return;
    }
    apiFetch<SessionUser>("/me")
      .then(setUser)
      .catch(() => setUser(null));
  }, [pathname]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  async function logout() {
    await apiFetch("/auth/logout", { method: "POST" }).catch(() => {});
    clearToken();
    setUser(null);
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/80 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 py-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2 text-[22px] font-semibold tracking-[-0.04em] text-sky-950">
          <LayoutGrid className="h-4 w-4 text-sky-700" strokeWidth={2.3} />
          <span>CYNEX</span>
        </Link>

        <nav className="hidden items-center gap-8 text-[13px] text-slate-600 lg:flex">
          {navItems.map((item) => {
            const active = item.key === activeKey;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "border-b-2 pb-1 transition",
                  active ? "border-sky-600 font-semibold text-sky-700" : "border-transparent hover:text-sky-700",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 text-sm sm:gap-3">
          {user ? (
            <>
              <Link
                href="/profile"
                className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 transition hover:border-sky-200 sm:inline-flex"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sky-100 text-xs font-bold text-sky-800">
                  {userInitials(user)}
                </span>
                <span className="max-w-[120px] truncate text-[13px] font-medium text-slate-700">
                  {user.name?.trim() || user.email.split("@")[0]}
                </span>
              </Link>
              <button
                type="button"
                onClick={logout}
                className="hidden items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-medium text-slate-600 transition hover:bg-slate-100 sm:inline-flex"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hidden font-medium text-slate-700 transition hover:text-sky-700 sm:inline-flex">
                Đăng nhập
              </Link>
              <Link
                href="/register"
                className="hidden items-center rounded-xl bg-sky-700 px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_10px_30px_rgba(10,116,184,0.25)] transition hover:bg-sky-800 sm:inline-flex"
              >
                Đăng ký
              </Link>
            </>
          )}

          <button
            type="button"
            aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 lg:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-slate-100 bg-white px-5 py-4 lg:hidden">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className={cn(
                  "block rounded-xl px-3 py-2.5 text-sm font-medium",
                  item.key === activeKey ? "bg-sky-50 text-sky-800" : "text-slate-700 hover:bg-slate-50",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 border-t border-slate-100 pt-4">
            {user ? (
              <div className="space-y-2">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <UserRound className="h-4 w-4" />
                  Tài khoản
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link href="/login" className="flex-1 rounded-xl border border-slate-200 py-2.5 text-center text-sm font-medium">
                  Đăng nhập
                </Link>
                <Link href="/register" className="flex-1 rounded-xl bg-sky-700 py-2.5 text-center text-sm font-semibold text-white">
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export function PremiumFooter() {
  return (
    <footer className="border-t border-white/80 bg-[#edf2fb]">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-5 py-14 lg:grid-cols-[1.3fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Link href="/" className="flex items-center gap-2 text-[24px] font-semibold tracking-[-0.04em] text-sky-950">
            <LayoutGrid className="h-5 w-5 text-sky-700" strokeWidth={2.3} />
            <span>CYNEX</span>
          </Link>
          <p className="mt-4 max-w-[260px] text-sm leading-7 text-slate-500">
            Nền tảng mua sắm dịch vụ số, bản quyền phần mềm và công cụ AI hàng đầu.
          </p>
        </div>

        {footerColumns.map((column) => (
          <div key={column.title}>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-900">{column.title}</h3>
            <div className="mt-5 space-y-3 text-sm text-slate-500">
              {column.links.map((link) => (
                <Link key={link.label} href={link.href} className="block transition hover:text-sky-700">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="soft-divider border-t">
        <div className="mx-auto flex max-w-[1180px] flex-col gap-3 px-5 py-5 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <p>© {new Date().getFullYear()} CYNEX. Premium Digital Service Marketplace.</p>
          <div className="flex gap-5">
            <Link href="/terms">Điều khoản dịch vụ</Link>
            <Link href="/privacy">Chính sách bảo mật</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function StaticPageLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="home-shell min-h-screen">
      <PremiumHeader />
      <main className="mx-auto max-w-[760px] px-5 pb-20 pt-10 lg:px-8">
        <h1 className="section-title text-3xl font-semibold tracking-[-0.03em] text-slate-950 lg:text-4xl">{title}</h1>
        {subtitle && <p className="mt-3 text-sm leading-7 text-slate-500">{subtitle}</p>}
        <div className="prose-cynex mt-8 space-y-4 text-sm leading-7 text-slate-600">{children}</div>
      </main>
      <PremiumFooter />
    </div>
  );
}
