import type { Metadata } from "next";
import { Manrope, IBM_Plex_Mono } from "next/font/google";
import { SiteShell } from "@/components/ui/shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cynex — Premium digital goods",
  description: "Nâng cấp app premium nhanh, rõ trạng thái, có bảo hành.",
};

const manrope = Manrope({
  subsets: ["latin", "vietnamese"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={`${manrope.variable} ${mono.variable}`}>
      <body className="font-[var(--font-body)]">
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
