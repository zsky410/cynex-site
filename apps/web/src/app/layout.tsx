import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cynex — Premium digital goods",
  description: "Mua app & tài khoản premium chính hãng, giao nhanh.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
            <Link href="/" className="text-lg font-bold text-brand">
              Cynex
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
      </body>
    </html>
  );
}
