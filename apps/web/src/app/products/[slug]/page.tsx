import Link from "next/link";
import { notFound } from "next/navigation";
import { publicFetch } from "@/lib/api";
import { PremiumFooter, PremiumHeader } from "@/components/storefront/PremiumChrome";
import { BuyPanel, type Variant } from "@/components/BuyPanel";
import {
  Bot,
  ChevronRight,
  Code2,
  MonitorPlay,
  Palette,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const visualMap = {
  streaming: { icon: MonitorPlay, tileClass: "from-slate-700 via-slate-900 to-black", glowClass: "shadow-[0_0_0_1px_rgba(191,219,254,0.7),0_0_40px_rgba(29,78,216,0.32)]" },
  design: { icon: Palette, tileClass: "from-slate-600 via-slate-900 to-black", glowClass: "shadow-[0_0_0_1px_rgba(254,240,138,0.4),0_0_40px_rgba(29,78,216,0.28)]" },
  development: { icon: Code2, tileClass: "from-slate-700 via-slate-900 to-black", glowClass: "shadow-[0_0_0_1px_rgba(125,211,252,0.55),0_0_40px_rgba(8,145,178,0.3)]" },
  "ai-tools": { icon: Bot, tileClass: "from-slate-700 via-slate-950 to-black", glowClass: "shadow-[0_0_0_1px_rgba(186,230,253,0.55),0_0_40px_rgba(14,165,233,0.28)]" },
} as const;

function normalizeCategoryKey(name?: string | null, slug?: string | null) {
  if (slug && slug in visualMap) return slug as keyof typeof visualMap;
  const source = `${name ?? ""} ${slug ?? ""}`.toLowerCase();
  if (source.includes("stream")) return "streaming";
  if (source.includes("design") || source.includes("adobe") || source.includes("canva")) return "design";
  if (source.includes("develop") || source.includes("code")) return "development";
  return "ai-tools";
}

function buildGuide(product: ProductDetail) {
  const base = [
    "Sau khi thanh toán thành công, hệ thống sẽ gửi email xác nhận.",
    "Kiểm tra email (bao gồm cả mục Spam) để nhận thông tin cấp quyền.",
    `Đăng nhập tài khoản ${product.name.split(" ")[0]} theo hướng dẫn được gửi.`,
    "Kích hoạt hoặc chấp nhận lời mời tham gia tổ chức nếu có.",
    "Hoàn tất thiết lập và bắt đầu sử dụng dịch vụ.",
  ];
  return base;
}

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  image?: {
    id: string;
    fileName: string;
    mimeType: string;
    size: number;
    publicUrl?: string | null;
    contentPath: string;
  } | null;
  guideFiles?: Array<{
    id: string;
    fileName: string;
    mimeType: string;
    size: number;
    publicUrl?: string | null;
    contentPath: string;
  }>;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  variants: Variant[];
}

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let product: ProductDetail;
  try {
    product = await publicFetch<ProductDetail>(`/products/${slug}`);
  } catch {
    notFound();
  }

  const categoryKey = normalizeCategoryKey(product.category?.name, product.category?.slug);
  const visual = visualMap[categoryKey];
  const VisualIcon = visual.icon;
  const guideItems = buildGuide(product);
  const policyItems = [
    "Bảo hành toàn bộ thời gian sử dụng gói.",
    "Hoàn tiền 100% nếu không thể cấp quyền trong vòng 24h.",
    "Đổi tài khoản mới hoặc hoàn tiền theo tỷ lệ thời gian còn lại nếu xảy ra lỗi.",
    "Hỗ trợ kỹ thuật qua Live Chat và Email trong giờ hành chính.",
  ];

  return (
    <div className="home-shell min-h-screen text-slate-900">
      <PremiumHeader activeKey="products" />
      <main>
        <div className="mx-auto max-w-[1120px] px-5 pb-28 pt-12 lg:px-8">
          <div className="mb-5 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <Link href="/" className="transition hover:text-sky-400">
              Trang chủ
            </Link>
            <ChevronRight className="h-4 w-4" />
            <Link href="/products" className="transition hover:text-sky-400">
              {product.category?.name ?? "Sản phẩm"}
            </Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-sky-900">{product.name}</span>
          </div>

          <article className="grid items-start gap-8 py-4 lg:grid-cols-2 lg:gap-12">
            <div className={"mx-auto w-full max-w-[580px] self-start " + (product.image?.publicUrl ? "" : visual.glowClass + " ")}>
              <div className="relative overflow-hidden rounded-[18px]">
                <div
                  className={`
                  relative flex aspect-[1268/636] min-h-[200px] items-center justify-center overflow-hidden rounded-[18px]
                  ${product.image?.publicUrl ? "bg-transparent" : `bg-gradient-to-br ${visual.tileClass}`}
                `}
                >
                  {product.image?.publicUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image.publicUrl}
                      alt={product.name}
                      className="relative z-[1] h-full w-full rounded-[18px] object-contain"
                    />
                  ) : (
                    <>
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_36%)]" />
                      <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:32px_32px]" />
                      <div className="relative h-[250px] w-[420px] max-w-full rounded-[18px] border border-slate-400/50 bg-gradient-to-br from-slate-300 via-slate-500 to-slate-950 shadow-[0_35px_70px_rgba(0,0,0,0.55)] [transform:rotateX(62deg)_rotateZ(-27deg)]">
                        <div className="absolute inset-0 rounded-[18px] bg-[radial-gradient(circle_at_40%_30%,rgba(255,255,255,0.28),transparent_30%)]" />
                        <div className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/20 text-slate-200 backdrop-blur-sm">
                          <VisualIcon className="h-12 w-12" strokeWidth={1.7} />
                        </div>
                        <div className="absolute bottom-5 right-8 h-4 w-4 rounded-full border border-slate-300/50" />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full min-w-0 pt-0.5">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                Sản phẩm
              </p>
              <h1 className="mt-2 text-balance text-[26px] font-semibold leading-[1.18] tracking-[-0.045em] text-[#0f172a] md:text-[31px]">
                {product.name}
              </h1>
              <p className="mt-2.5 text-sm text-slate-500">
                Mã sản phẩm: <span className="font-semibold text-slate-700">{product.slug}</span>
              </p>
              {product.shortDescription ? (
                <p className="mt-2.5 max-w-[460px] text-[14px] leading-6 text-slate-500">
                  {product.shortDescription}
                </p>
              ) : null}

              <div className="mt-4 w-full">
                <BuyPanel variants={product.variants} productName={product.name} productSlug={product.slug} />
              </div>
            </div>
          </article>

          <div className="mt-12 pt-12">
            <h2 className="section-title text-center text-[42px] font-semibold tracking-[-0.04em] text-[#0f2c56]">
              Hướng dẫn & Chính sách
            </h2>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <section className="rounded-[22px] bg-[#eef5ff] p-6 text-slate-700">
                <div className="mb-4 flex items-center gap-3 text-[28px] font-semibold tracking-[-0.04em] text-slate-800">
                  <Sparkles className="h-6 w-6 text-sky-700" />
                  Hướng dẫn sử dụng
                </div>
                <ol className="space-y-2 text-[15px] leading-8">
                  {guideItems.map((item, index) => (
                    <li key={item}>
                      {index + 1}. {item}
                    </li>
                  ))}
                </ol>
                {product.guideFiles?.length ? (
                  <div className="mt-5 border-t border-slate-200 pt-4">
                    <p className="text-sm font-semibold text-slate-800">Tệp hướng dẫn</p>
                    <div className="mt-2 flex flex-col gap-2">
                      {product.guideFiles.map((file) => (
                        <a
                          key={file.id}
                          href={file.publicUrl ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-medium text-sky-700 underline"
                        >
                          {file.fileName}
                        </a>
                      ))}
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="rounded-[22px] bg-[#eef5ff] p-6 text-slate-700">
                <div className="mb-4 flex items-center gap-3 text-[28px] font-semibold tracking-[-0.04em] text-slate-800">
                  <ShieldCheck className="h-6 w-6 text-sky-700" />
                  Chính sách bảo hành
                </div>
                <ul className="space-y-2 text-[15px] leading-8">
                  {policyItems.map((item) => (
                    <li key={item} className="flex gap-3">
                      <span className="mt-3 h-1.5 w-1.5 rounded-full bg-slate-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                {product.description ? (
                  <p className="mt-4 border-t border-slate-200 pt-4 text-sm leading-7 text-slate-500 whitespace-pre-line">
                    {product.description}
                  </p>
                ) : null}
              </section>
            </div>
          </div>
        </div>
      </main>
      <PremiumFooter />
    </div>
  );
}
