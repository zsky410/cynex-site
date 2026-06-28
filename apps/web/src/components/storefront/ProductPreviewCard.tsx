import Link from "next/link";
import {
  Bot,
  BriefcaseBusiness,
  Code2,
  MonitorPlay,
  Palette,
  type LucideIcon,
} from "lucide-react";
import { formatVnd } from "@/lib/utils";

export interface StorefrontCategory {
  id: string;
  name: string;
  slug: string;
}

export interface StorefrontVariant {
  id?: string;
  name?: string;
  price: number;
  fulfillmentType?: string;
  status: string;
}

export interface StorefrontProduct {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  image?: {
    id: string;
    fileName: string;
    mimeType: string;
    size: number;
    publicUrl?: string | null;
    contentPath: string;
  } | null;
  category?: StorefrontCategory | null;
  variants: StorefrontVariant[];
}

type CategoryPresentation = {
  label: string;
  icon: LucideIcon;
  chipClass: string;
  tileClass: string;
};

const categoryMeta: Record<string, CategoryPresentation> = {
  "ai-tools": { label: "AI Tools", icon: Bot, chipClass: "bg-sky-50 text-sky-700", tileClass: "from-sky-100 via-cyan-50 to-white" },
  streaming: { label: "Streaming", icon: MonitorPlay, chipClass: "bg-emerald-50 text-cyan-700", tileClass: "from-emerald-100 via-cyan-50 to-white" },
  design: { label: "Design", icon: Palette, chipClass: "bg-fuchsia-50 text-cyan-700", tileClass: "from-indigo-100 via-sky-50 to-white" },
  development: { label: "Development", icon: Code2, chipClass: "bg-slate-100 text-cyan-700", tileClass: "from-slate-100 via-sky-50 to-white" },
  productivity: { label: "Productivity", icon: BriefcaseBusiness, chipClass: "bg-cyan-50 text-cyan-700", tileClass: "from-cyan-100 via-blue-50 to-white" },
  uncategorized: { label: "Khác", icon: BriefcaseBusiness, chipClass: "bg-slate-100 text-slate-700", tileClass: "from-slate-100 via-slate-50 to-white" },
};

const keywordFallbacks = [
  { key: "ai-tools", match: ["chatgpt", "midjourney", "claude", "gemini", "ai"] },
  { key: "streaming", match: ["spotify", "netflix", "youtube", "disney", "prime"] },
  { key: "design", match: ["canva", "adobe", "figma", "creative"] },
  { key: "development", match: ["github", "copilot", "cursor", "jetbrains", "vercel"] },
  { key: "productivity", match: ["notion", "office", "workspace", "grammarly", "slack"] },
] as const;

export function getCategoryPresentation(category?: StorefrontCategory | null, product?: Pick<StorefrontProduct, "name" | "shortDescription"> | null) {
  const slug = category?.slug?.trim().toLowerCase();
  if (slug && slug in categoryMeta) {
    return { key: slug, ...categoryMeta[slug], label: category?.name || categoryMeta[slug].label };
  }

  const source = `${category?.name ?? ""} ${slug ?? ""} ${product?.name ?? ""} ${product?.shortDescription ?? ""}`.toLowerCase();
  const hit = keywordFallbacks.find((item) => item.match.some((keyword) => source.includes(keyword)));
  const key = hit?.key ?? "uncategorized";
  return { key, ...categoryMeta[key], label: category?.name || categoryMeta[key].label };
}

export function minActivePrice(variants: StorefrontVariant[]): number | null {
  const active = variants.filter((variant) => variant.status === "active" || variant.status === "out_of_stock");
  if (!active.length) return null;
  return Math.min(...active.map((variant) => variant.price));
}

export function inferCadence(variants: StorefrontVariant[]) {
  const source = variants.map((variant) => variant.name?.toLowerCase() ?? "").join(" ");
  if (source.includes("vĩnh viễn") || source.includes("lifetime")) return "/gói";
  if (source.includes("năm") || source.includes("12 tháng")) return "/năm";
  return "/tháng";
}

export function ProductPreviewCard({
  product,
}: {
  product: StorefrontProduct;
}) {
  const presentation = getCategoryPresentation(product.category, product);
  const price = minActivePrice(product.variants);
  const Icon = presentation.icon;

  return (
    <article className="transition hover:-translate-y-0.5">
      <Link href={`/products/${product.slug}`} className="block">
        <div className={`relative aspect-[1268/636] overflow-hidden rounded-[8px] bg-gradient-to-br ${presentation.tileClass}`}>
          {product.image?.publicUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image.publicUrl} alt={product.name} className="h-full w-full rounded-[8px] object-contain" />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Icon className="h-10 w-10 text-sky-700" />
            </div>
          )}
        </div>
        <div className="space-y-2 pt-3.5">
          <h3 className="line-clamp-2 text-[16px] font-normal leading-6 text-slate-950">
            {product.name}
          </h3>
          <div className="flex items-end justify-between gap-4 pt-0.5">
            <div>
              <p className="text-[16px] font-semibold text-slate-950">
                {price != null ? formatVnd(price) : "Liên hệ"}
              </p>
            </div>
            <span className="text-[14px] font-normal text-sky-700">
              Xem chi tiết
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
