import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CirclePlay,
  CreditCard,
  Grid2X2,
  Headphones,
  LayoutGrid,
  MonitorPlay,
  Music4,
  PackageCheck,
  Palette,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  Wallet,
} from "lucide-react";
import { PremiumFooter, PremiumHeader } from "@/components/storefront/PremiumChrome";
import { FeaturedProducts } from "@/components/storefront/FeaturedProducts";

const categories = [
  { label: "AI Tools", icon: Bot },
  { label: "Streaming", icon: MonitorPlay },
  { label: "Thiết kế", icon: Palette },
  { label: "Văn phòng", icon: CreditCard },
  { label: "Bảo mật", icon: ShieldCheck },
  { label: "Khác", icon: Grid2X2 },
];

const steps = [
  {
    step: "1",
    title: "Chọn gói",
    description: "Lựa chọn sản phẩm và thời gian sử dụng phù hợp với nhu cầu.",
    icon: ShoppingCart,
  },
  {
    step: "2",
    title: "Thanh toán",
    description: "Thanh toán an toàn qua chuyển khoản ngân hàng hoặc ví điện tử.",
    icon: Wallet,
  },
  {
    step: "3",
    title: "Admin xử lý",
    description: "Hệ thống ghi nhận và admin tiến hành kích hoạt hoặc nâng cấp tài khoản.",
    icon: PackageCheck,
  },
  {
    step: "4",
    title: "Nhận thông tin",
    description: "Nhận thông tin tài khoản qua email hoặc trực tiếp trên hệ thống.",
    icon: Headphones,
  },
];

const floatingIcons = [
  { icon: ShoppingCart, className: "left-10 top-12 text-sky-700" },
  { icon: CirclePlay, className: "left-16 top-44 text-rose-500" },
  { icon: Sparkles, className: "left-40 bottom-12 text-indigo-500" },
  { icon: CreditCard, className: "right-12 top-14 text-rose-500" },
  { icon: Music4, className: "right-14 bottom-16 text-emerald-500" },
];

export default function HomePage() {
  return (
    <div className="home-shell">
      <PremiumHeader />

      <main>
        <section className="mx-auto grid max-w-[1180px] gap-12 px-5 pb-16 pt-12 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pt-16">
          <div className="flex flex-col justify-center">
            <div className="mb-7 inline-flex w-fit items-center gap-2 rounded-full border border-sky-100 bg-white/90 px-4 py-2 text-[12px] text-sky-700 shadow-sm">
              <span className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-sky-200 bg-sky-50">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
              </span>
              Nền tảng dịch vụ số premium
            </div>

            <h1 className="section-title text-balance max-w-[560px] text-5xl font-semibold leading-[1.06] tracking-[-0.05em] text-slate-950 lg:text-[64px]">
              Nâng cấp trải nghiệm số cùng{" "}
              <span className="text-sky-700 underline decoration-sky-200 underline-offset-4">Cynex</span>
            </h1>

            <p className="mt-6 max-w-[520px] text-[17px] leading-8 text-slate-500">
              Khám phá kho ứng dụng, công cụ AI và dịch vụ giải trí bản quyền với mức giá tốt nhất.
              Tự động hóa quy trình, hỗ trợ 24/7.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/products"
                className="inline-flex items-center rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_35px_rgba(10,116,184,0.22)] transition hover:bg-sky-800"
              >
                Khám phá sản phẩm
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-600 transition hover:border-sky-200 hover:text-sky-700"
              >
                Hướng dẫn mua hàng
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-2">
                {[0, 1, 2].map((item) => (
                  <div
                    key={item}
                    className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-sky-100 to-slate-200 text-xs font-semibold text-sky-900 shadow-sm"
                  >
                    {item + 1}
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-500">
                <span className="font-semibold text-slate-950">10,000+</span> khách hàng tin dùng
              </p>
            </div>
          </div>

          <div className="relative flex min-h-[430px] items-center justify-center lg:min-h-[520px]">
            <div className="glass-panel relative flex h-full min-h-[430px] w-full items-center justify-center overflow-hidden rounded-[34px] px-8 py-10">
              {floatingIcons.map(({ icon: Icon, className }) => (
                <div
                  key={className}
                  className={`absolute flex h-12 w-12 items-center justify-center rounded-2xl border border-white/80 bg-white shadow-[0_16px_40px_rgba(15,23,42,0.08)] ${className}`}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
              ))}

              <div className="relative flex h-36 w-36 flex-col items-center justify-center rounded-[28px] border-2 border-sky-200 bg-gradient-to-b from-white to-sky-50 shadow-[0_18px_50px_rgba(10,116,184,0.16)]">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-sm">
                  <Bot className="h-6 w-6" strokeWidth={2.3} />
                </div>
                <span className="mt-4 text-center text-[11px] font-semibold tracking-[0.28em] text-sky-900">
                  CYNEX
                  <br />
                  CORE
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1180px] px-5 py-10 lg:px-8">
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="section-title text-4xl font-semibold tracking-[-0.04em] text-slate-950">Danh mục nổi bật</h2>
            <Link href="/products" className="text-sm font-medium text-sky-700 transition hover:text-sky-800">
              Xem tất cả
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            {categories.map(({ label, icon: Icon }) => (
              <Link
                key={label}
                href="/products"
                className="glass-panel flex min-h-28 flex-col items-center justify-center rounded-2xl p-4 text-center transition hover:-translate-y-1 hover:shadow-[0_30px_60px_rgba(15,23,42,0.1)]"
              >
                <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-sky-50 text-sky-700">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-medium text-slate-700">{label}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1180px] px-5 py-12 lg:px-8">
          <div className="text-center">
            <h2 className="section-title text-4xl font-semibold tracking-[-0.04em] text-slate-950">Sản phẩm bán chạy</h2>
            <p className="mt-3 text-sm text-slate-500">
              Các gói dịch vụ số được người dùng lựa chọn nhiều nhất trong tuần.
            </p>
          </div>

          <FeaturedProducts />

          <div className="mt-10 text-center">
            <Link
              href="/products"
              className="inline-flex rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-600 transition hover:border-sky-200 hover:text-sky-700"
            >
              Xem tất cả sản phẩm
            </Link>
          </div>
        </section>

        <section className="mt-8 border-y border-white/80 bg-[#eef3fb]">
          <div className="mx-auto max-w-[1180px] px-5 py-16 lg:px-8">
            <div className="text-center">
              <h2 className="section-title text-4xl font-semibold tracking-[-0.04em] text-slate-950">
                Quy trình đơn giản, nhanh chóng
              </h2>
              <p className="mt-3 text-sm text-slate-500">
                Chỉ với 4 bước cơ bản để sở hữu và sử dụng dịch vụ số chất lượng cao.
              </p>
            </div>

            <div className="mt-12 grid gap-6 lg:grid-cols-4">
              {steps.map(({ description, icon: Icon, step, title }) => (
                <div key={title} className="relative text-center">
                  <div className="absolute left-1/2 top-8 hidden h-px w-full -translate-x-1/2 bg-slate-200 lg:block" />
                  <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-sky-700 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                    <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-sky-700 text-[11px] font-semibold text-white">
                      {step}
                    </span>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-slate-900">{title}</h3>
                  <p className="mx-auto mt-3 max-w-[240px] text-sm leading-7 text-slate-500">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1180px] px-5 py-10 lg:px-8 lg:py-12">
          <div className="rounded-[28px] bg-[#1da5e6] px-8 py-10 text-white shadow-[0_28px_70px_rgba(29,165,230,0.25)] lg:flex lg:items-center lg:justify-between lg:px-12">
            <div className="max-w-[520px]">
              <h2 className="section-title text-4xl font-semibold tracking-[-0.04em]">Cần tư vấn chọn gói dịch vụ?</h2>
              <p className="mt-4 text-[15px] leading-7 text-sky-50">
                Đội ngũ hỗ trợ của Cynex luôn sẵn sàng tư vấn giải pháp số phù hợp nhất với nhu cầu làm việc và giải trí của bạn.
              </p>
            </div>
            <div className="mt-6 lg:mt-0">
              <Link
                href="/warranty"
                className="inline-flex items-center rounded-xl bg-white px-6 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-50"
              >
                Liên hệ tư vấn ngay
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PremiumFooter />
    </div>
  );
}
