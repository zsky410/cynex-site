import Link from "next/link";
import { ArrowRight, LayoutGrid, LifeBuoy, ReceiptText, Search, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/products", label: "Sản phẩm", icon: LayoutGrid },
  { href: "/orders", label: "Đơn hàng", icon: ReceiptText },
  { href: "/warranty", label: "Hỗ trợ", icon: LifeBuoy },
  { href: "/wallet", label: "Ví", icon: Wallet },
];

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="site-noise" />
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#070b14]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-6">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-400/10 text-lg font-semibold text-cyan-300">
              C
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-[0.18em] text-white">CYNEX</span>
              <span className="block text-[11px] uppercase tracking-[0.28em] text-slate-400">
                premium digital access
              </span>
            </span>
          </Link>

          <div className="hidden flex-1 items-center justify-center lg:flex">
            <div className="search-shell max-w-xl">
              <Search className="size-4 text-slate-400" />
              <input
                aria-label="Tìm sản phẩm"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                placeholder="Tìm Spotify, Canva, ChatGPT Plus..."
                readOnly
              />
            </div>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {NAV.map(({ href, label, icon: Icon }) => (
              <NavLink key={href} href={href} label={label} Icon={Icon} />
            ))}
            <Link href="/login" className="button-secondary ml-2">
              Đăng nhập
            </Link>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 pb-4 md:hidden">
          {NAV.map(({ href, label, icon: Icon }) => (
            <NavLink key={href} href={href} label={label} Icon={Icon} compact />
          ))}
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 md:gap-10 md:px-6 md:py-10">
        {children}
      </main>
      <footer className="mx-auto flex w-full max-w-7xl flex-col gap-4 border-t border-white/8 px-4 py-8 text-sm text-slate-400 md:flex-row md:items-center md:justify-between md:px-6">
        <p>Nâng cấp app premium nhanh, rõ trạng thái, có bảo hành.</p>
        <Link href="/products" className="inline-flex items-center gap-2 text-slate-200 transition hover:text-cyan-300">
          Khám phá sản phẩm
          <ArrowRight className="size-4" />
        </Link>
      </footer>
    </>
  );
}

function NavLink({
  href,
  label,
  Icon,
  compact = false,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 text-slate-200 transition hover:border-cyan-400/20 hover:bg-cyan-400/8 hover:text-cyan-200",
        compact ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm",
      )}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  );
}
