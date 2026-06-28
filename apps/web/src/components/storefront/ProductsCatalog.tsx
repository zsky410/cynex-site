"use client";

import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ProductPreviewCard,
  minActivePrice,
  type StorefrontCategory,
  type StorefrontProduct,
} from "@/components/storefront/ProductPreviewCard";

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

function minPrice(product: StorefrontProduct) {
  return minActivePrice(product.variants) ?? 0;
}

function matchesPrice(product: StorefrontProduct, value: string) {
  const price = minPrice(product);
  if (value === "under-100") return price < 100000;
  if (value === "100-300") return price >= 100000 && price <= 300000;
  if (value === "300-plus") return price > 300000;
  return true;
}

function matchesFulfillment(product: StorefrontProduct, value: string) {
  if (value === "all") return true;
  const types = product.variants.map((variant) => variant.fulfillmentType);
  if (value === "upgrade") return types.includes("CUSTOMER_ACCOUNT_UPGRADE");
  if (value === "shared") return types.includes("SHARED_ACCOUNT");
  if (value === "dedicated") return types.includes("DEDICATED_ACCOUNT");
  if (value === "license") return types.includes("LICENSE_KEY");
  return true;
}

function matchesDuration(product: StorefrontProduct, value: string) {
  if (value === "all") return true;
  const source = product.variants.map((variant) => variant.name?.toLowerCase() ?? "").join(" ");
  if (value === "monthly") return source.includes("tháng");
  if (value === "yearly") return source.includes("năm");
  if (value === "lifetime") return source.includes("vĩnh viễn") || source.includes("lifetime");
  return true;
}

export function ProductsCatalog({
  products,
  categories,
}: {
  products: StorefrontProduct[];
  categories: StorefrontCategory[];
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
    const matchesCategory = activeCategory === "all" || product.category?.slug === activeCategory;

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

      <div className="mt-16 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {visibleProducts.map((product) => (
          <ProductPreviewCard key={product.id} product={product} />
        ))}
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
