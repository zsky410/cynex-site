import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import { CartProvider } from "@/components/cart/cart-store";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cynex — Premium digital goods",
  description: "Mua app & tài khoản premium chính hãng, giao nhanh.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <CartProvider>
          <AppShell>{children}</AppShell>
        </CartProvider>
      </body>
    </html>
  );
}
