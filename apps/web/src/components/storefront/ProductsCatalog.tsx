"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  ChevronDown,
  Code2,
  MonitorPlay,
  Music4,
  Palette,
  Search,
  Sparkles,
} from "lucide-react";
import { cn, formatVnd } from "@/lib/utils";

interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
}

interface CatalogVariant {
  id: string;
  name: string;
  price: number;
  fulfillmentType: string;
  status: string;
}

interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  imageFileId?: string | null;
  category?: CatalogCategory | null;
  variants: CatalogVariant[];
}

const categoryMeta = {
  "ai-tools": { label: "AI Tools", icon: Bot, chipClass: "bg-sky-50 text-sky-700", tileClass: "from-sky-100 via-cyan-50 to-white" },
  streaming: { label: "Streaming", icon: MonitorPlay, chipClass: "bg-emerald-50 text-cyan-700", tileClass: "from-emerald-100 via-cyan-50 to-white" },
  design: { label: "Design", icon: Palette, chipClass: "bg-fuchsia-50 text-cyan-700", tileClass: "from-indigo-100 via-sky-50 to-white" },
  development: { label: "Development", icon: Code2, chipClass: "bg-slate-100 text-cyan-700", tileClass: "from-slate-100 via-sky-50 to-white" },
  productivity: { label: "Productivity", icon: BriefcaseBusiness, chipClass: "bg-cyan-50 text-cyan-700", tileClass: "from-cyan-100 via-blue-50 to-white" },
} as const;

const keywordFallbacks = [
  { key: "ai-tools", match: ["chatgpt", "midjourney", "claude", "gemini", "ai"] },
  { key: "streaming", match: ["spotify", "netflix", "youtube", "disney", "prime"] },
  { key: "design", match: ["canva", "adobe", "figma", "creative"] },
  { key: "development", match: ["github", "copilot", "cursor", "jetbrains", "vercel"] },
  { key: "productivity", match: ["notion", "office", "workspace", "grammarly", "slack"] },
] as const;

const priceRanges = [
  { value: "all", label: "Khoảng giá" },
  { value: "under-100", label: "Dưới 100.000đ" },
  { value: "100-300", label: "100.000đ - 300.000đ" },
  { value: "300-plus", label: "Trên 300.000đ" },
];

const fulfillmentOptions = [
  { value: "all", label: "Hình thức" },
  { value: "upgrade", label: "Nâng cấp chính chủ" },
  { value: "shared", label: "Tài khoản dùng chung" },
  { value: "dedicated", label: "Tài khoản riêng" },
  { value: "license", label: "License / key" },
];

const durationOptions = [
  { value: "all", label: "Thời hạn" },
  { value: "monthly", label: "Theo tháng" },
  { value: "yearly", label: "Theo năm" },
  { value: "lifetime", label: "Dài hạn / vĩnh viễn" },
];

function normalizeCategory(product: CatalogProduct) {
  const slug = product.category?.slug;
  if (slug && slug in categoryMeta) {
    return slug as keyof typeof categoryMeta;
  }

  const name = `${product.name} ${product.shortDescription ?? ""}`.toLowerCase();
  const hit = keywordFallbacks.find((item) => item.match.some((keyword) => name.includes(keyword)));
  return (hit?.key ?? "ai-tools") as keyof typeof categoryMeta;
}

function minPrice(product: CatalogProduct) {
  if (!product.variants.length) return 0;
  return Math.min(...product.variants.map((variant) => variant.price));
}

function inferCadence(product: CatalogProduct) {
  const source = product.variants.map((variant) => variant.name.toLowerCase()).join(" ");
  if (source.includes("vĩnh viễn") || source.includes("lifetime")) return "/gói";
  if (source.includes("năm") || source.includes("12 tháng")) return "/năm";
  return "/tháng";
}

function matchesPrice(product: CatalogProduct, value: string) {
  const price = minPrice(product);
  if (value === "under-100") return price < 100000;
  if (value === "100-300") return price >= 100000 && price <= 300000;
  if (value === "300-plus") return price > 300000;
  return true;
}

function matchesFulfillment(product: CatalogProduct, value: string) {
  if (value === "all") return true;
  const types = product.variants.map((variant) => variant.fulfillmentType);
  if (value === "upgrade") return types.includes("CUSTOMER_ACCOUNT_UPGRADE");
  if (value === "shared") return types.includes("SHARED_ACCOUNT");
  if (value === "dedicated") return types.includes("DEDICATED_ACCOUNT");
  if (value === "license") return types.includes("LICENSE_KEY");
  return true;
}

function matchesDuration(product: CatalogProduct, value: string) {
  if (value === "all") return true;
  const source = product.variants.map((variant) => variant.name.toLowerCase()).join(" ");
  if (value === "monthly") return source.includes("tháng");
  if (value === "yearly") return source.includes("năm");
  if (value === "lifetime") return source.includes("vĩnh viễn") || source.includes("lifetime");
  return true;
}

export function ProductsCatalog({
  products,
  categories,
}: {
  products: CatalogProduct[];
  categories: CatalogCategory[];
}) {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [fulfillment, setFulfillment] = useState("all");
  const [duration, setDuration] = useState("all");
  const [visibleCount, setVisibleCount] = useState(8);

  const chips = [
    { value: "all", label: "Tất cả" },
    ...categories.map((category) => ({
      value: category.slug,
      label: category.name,
    })),
  ];

  const filtered = products.filter((product) => {
    const query = `${product.name} ${product.shortDescription ?? ""}`.toLowerCase();
    const matchesSearch = !search.trim() || query.includes(search.trim().toLowerCase());
    const matchesCategory = activeCategory === "all" || product.category?.slug === activeCategory || normalizeCategory(product) === activeCategory;
    return (
      matchesSearch &&
      matchesCategory &&
      matchesPrice(product, priceRange) &&
      matchesFulfillment(product, fulfillment) &&
      matchesDuration(product, duration)
    );
  });

  const visibleProducts = filtered.slice(0, visibleCount);

  return (
    <>
      <div className="mt-12 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <label className="group flex h-14 w-full max-w-[386px] items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 shadow-[0_12px_40px_rgba(15,23,42,0.04)] transition focus-within:border-sky-200">
          <Search className="h-5 w-5 text-slate-400 transition group-focus-within:text-sky-600" />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setVisibleCount(8);
            }}
            placeholder="Tìm kiếm dịch vụ..."
            className="w-full bg-transparent text-[15px] text-slate-700 outline-none placeholder:text-slate-400"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          <FilterSelect value={priceRange} options={priceRanges} onChange={setPriceRange} />
          <FilterSelect value={fulfillment} options={fulfillmentOptions} onChange={setFulfillment} />
          <FilterSelect value={duration} options={durationOptions} onChange={setDuration} />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {chips.map((chip) => (
          <button
            key={chip.value}
            type="button"
            onClick={() => {
              setActiveCategory(chip.value);
              setVisibleCount(8);
            }}
            className={cn(
              "rounded-full border px-4 py-2 text-sm transition",
              activeCategory === chip.value
                ? "border-sky-100 bg-sky-100 font-medium text-sky-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-sky-100 hover:text-sky-700",
            )}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="mt-16 grid gap-7 md:grid-cols-2 xl:grid-cols-4">
        {visibleProducts.map((product) => {
          const categoryKey = normalizeCategory(product);
          const meta = categoryMeta[categoryKey];
          const Icon = meta.icon;
          const price = minPrice(product);
          const cadence = inferCadence(product);

          return (
            <Link
              key={product.id}
              href={`/products/${product.slug}`}
              className="group flex min-h-[258px] flex-col justify-between rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_22px_60px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_30px_70px_rgba(15,23,42,0.12)]"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <span className={cn("flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br shadow-sm", meta.tileClass)}>
                    <Icon className="h-7 w-7 text-sky-700" />
                  </span>
                  <span className={cn("rounded-full px-3 py-1 text-xs font-medium", meta.chipClass)}>
                    {meta.label}
                  </span>
                </div>

                <h3 className="mt-6 text-[24px] font-semibold leading-[1.2] tracking-[-0.04em] text-slate-950">
                  {product.name}
                </h3>
                <p className="mt-3 line-clamp-3 text-[15px] leading-7 text-slate-500">
                  {product.shortDescription ?? "Gói dịch vụ premium được tuyển chọn để tối ưu công việc và giải trí hàng ngày."}
                </p>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Giá từ</p>
                    <p className="mt-1 text-[17px] font-semibold text-sky-700">
                      {formatVnd(price)}
                      <span className="ml-1 font-medium text-slate-400">{cadence}</span>
                    </p>
                  </div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sky-50 text-sky-700 transition group-hover:bg-sky-100">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {visibleProducts.length === 0 ? (
        <div className="mt-14 rounded-[28px] border border-dashed border-slate-200 bg-white/70 px-6 py-14 text-center text-slate-500">
          Không tìm thấy sản phẩm phù hợp với bộ lọc hiện tại.
        </div>
      ) : null}

      {visibleCount < filtered.length ? (
        <div className="mt-14 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + 8)}
            className="inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-7 py-4 text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
          >
            Tải thêm sản phẩm
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </>
  );
}

function FilterSelect({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 min-w-[138px] appearance-none rounded-2xl border border-slate-200 bg-white px-4 pr-10 text-sm font-medium text-slate-700 outline-none transition hover:border-sky-200"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
    </div>
  );
}
