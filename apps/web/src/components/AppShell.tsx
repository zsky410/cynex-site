"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CynexLogo } from "@/components/CynexLogo";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isStandaloneRoute =
    pathname === "/" ||
    pathname === "/cart" ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/checkout/") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/warranty") ||
    pathname === "/profile" ||
    pathname === "/wallet" ||
    pathname === "/guide" ||
    pathname === "/terms" ||
    pathname === "/privacy" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname.startsWith("/reset-password");

  if (isStandaloneRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link href="/" className="inline-flex items-center transition hover:opacity-85">
            <CynexLogo className="text-[26px]" />
          </Link>
          <nav className="flex gap-4 text-sm">
            <Link href="/products">Sản phẩm</Link>
            <Link href="/orders">Đơn của tôi</Link>
            <Link href="/warranty">Hỗ trợ</Link>
            <Link href="/wallet">Ví</Link>
            <Link href="/login">Đăng nhập</Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </>
  );
}
