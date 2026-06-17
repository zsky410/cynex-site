import Link from "next/link";
import { ArrowRight, CheckCircle2, LayoutGrid, ShieldCheck, TimerReset, Wallet } from "lucide-react";
import { ProductCard, type CatalogProductCard } from "@/components/catalog/product-card";
import { Panel, PanelGrid } from "@/components/ui/panel";
import { ProductVisual } from "@/components/ui/product-visual";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusPill } from "@/components/ui/status-pill";
import { publicFetch } from "@/lib/api";

export const dynamic = "force-dynamic";

const CATEGORY_CHIPS = ["Spotify", "Canva", "Netflix", "ChatGPT", "YouTube Premium"];

const STEPS = [
  { title: "Chọn gói", description: "Xem gói phù hợp và kiểm tra cách giao hàng.", icon: LayoutGrid },
  { title: "Thanh toán", description: "Dùng payOS hoặc ví Cynex trong cùng một flow.", icon: Wallet },
  { title: "Admin xử lý", description: "Đơn chuyển sang trạng thái chờ xử lý rõ ràng.", icon: TimerReset },
  { title: "Nhận thông tin", description: "Xem thông tin sử dụng và bảo hành trong tài khoản.", icon: ShieldCheck },
];

export default async function HomePage() {
  const products = await publicFetch<CatalogProductCard[]>("/products");
  const featured = products.slice(0, 3);

  return (
    <section className="space-y-8 md:space-y-10">
      <div className="hero-grid">
        <Panel className="relative overflow-hidden p-6 md:p-8">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.24),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.18),transparent_26%)]" />
          <div className="relative">
            <StatusPill label="Dark-first premium flow" tone="info" />
            <h1 className="mt-6 max-w-3xl text-balance text-4xl font-semibold leading-tight text-white md:text-6xl">
              Nâng cấp app premium nhanh, rõ trạng thái, có bảo hành.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
              Chọn gói, thanh toán, theo dõi đơn và xem thông tin sử dụng trong cùng tài khoản Cynex.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/products" className="button-primary">
                Khám phá sản phẩm
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/orders" className="button-secondary">
                Xem đơn của tôi
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-2">
              {CATEGORY_CHIPS.map((chip) => (
                <span key={chip} className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-slate-300">
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </Panel>

        <ProductVisual
          title="Mua nhanh, không rối"
          subtitle="Tập trung vào ba thứ user thật sự quan tâm: giá, cách nhận hàng, và trạng thái xử lý."
          className="h-full min-h-[360px]"
        />
      </div>

      <PanelGrid className="grid-cols-1 md:grid-cols-3">
        <Panel className="bg-cyan-400/8">
          <p className="eyebrow">Cam kết</p>
          <p className="mt-3 text-lg font-semibold text-white">Không hứa giao tự động khi quy trình vẫn do admin xử lý.</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">Mỗi trạng thái được ghi rõ để user không phải đoán đơn đang ở đâu.</p>
        </Panel>
        <Panel>
          <p className="eyebrow">Thanh toán</p>
          <p className="mt-3 text-lg font-semibold text-white">payOS / VietQR hoặc Ví Cynex.</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">Checkout gọn, không upsell, không kéo dài nhiều bước.</p>
        </Panel>
        <Panel>
          <p className="eyebrow">Bảo hành</p>
          <p className="mt-3 text-lg font-semibold text-white">Mở case hỗ trợ trực tiếp từ đơn hàng đã giao.</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">Theo dõi hội thoại và gửi tệp đính kèm trong cùng một khu vực.</p>
        </Panel>
      </PanelGrid>

      <SectionHeader
        eyebrow="Featured"
        title="Sản phẩm nổi bật"
        description="Danh sách này đang lấy trực tiếp từ API hiện có. Visual chỉ là placeholder có chủ đích để sau này thay asset thật."
        action={
          <Link href="/products" className="button-secondary">
            Xem toàn bộ
          </Link>
        }
      />
      <div className="grid gap-5 lg:grid-cols-3">
        {featured.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      <SectionHeader
        eyebrow="How it works"
        title="Mua theo 4 bước ngắn"
        description="Flow giữ đúng nghiệp vụ MVP: thanh toán xong là chờ admin xử lý, không gợi ý nhầm rằng hệ thống giao tự động."
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {STEPS.map(({ title, description, icon: Icon }, index) => (
          <Panel key={title} className="relative overflow-hidden">
            <div className="absolute right-4 top-4 text-5xl font-semibold text-white/5">{String(index + 1).padStart(2, "0")}</div>
            <Icon className="size-5 text-cyan-300" />
            <h3 className="mt-4 text-lg font-semibold text-white">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
          </Panel>
        ))}
      </div>

      <Panel className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="eyebrow">Trust signals</p>
          <h3 className="mt-2 text-2xl font-semibold text-white">Rõ trạng thái hơn là hứa hẹn chung chung.</h3>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
            Cynex ưu tiên việc bạn biết chính xác đang thanh toán, chờ xử lý, hay đã nhận thông tin sử dụng.
          </p>
        </div>
        <div className="grid gap-3 md:min-w-[300px]">
          {[
            "Đã thanh toán - chờ xử lý",
            "Admin đang xử lý đơn hàng",
            "Thông tin sử dụng sẽ được gửi sau khi hoàn tất",
          ].map((item) => (
            <div key={item} className="inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-200">
              <CheckCircle2 className="size-4 text-emerald-300" />
              {item}
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}
