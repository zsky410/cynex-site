"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { ProductCard, type CatalogProductCard } from "@/components/catalog/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Panel } from "@/components/ui/panel";
import { SectionHeader } from "@/components/ui/section-header";

const FULFILLMENT_CHIPS = [
  "Tất cả",
  "Nâng cấp chính chủ",
  "Tài khoản riêng",
  "Tài khoản dùng chung",
  "Key/License",
] as const;

export function ProductsExplorer({ products }: { products: CatalogProductCard[] }) {
  const [query, setQuery] = useState("");
  const [activeChip, setActiveChip] = useState<(typeof FULFILLMENT_CHIPS)[number]>("Tất cả");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return products.filter((product) => {
      const textMatch =
        !normalized ||
        product.name.toLowerCase().includes(normalized) ||
        product.shortDescription?.toLowerCase().includes(normalized);
      return textMatch;
    });
  }, [products, query]);

  return (
    <section className="space-y-6">
      <SectionHeader
        eyebrow="Catalog"
        title="Chọn đúng gói trong một không gian mua hàng gọn và rõ trạng thái"
        description="Filter hiện tại ưu tiên trải nghiệm UI và tìm kiếm cục bộ. Sau này có thể nối sang query thật mà không cần thay layout."
      />

      <Panel className="overflow-hidden">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="search-shell rounded-[22px] border-white/8 bg-[#0c1324]">
            <Search className="size-4 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              placeholder="Tìm tên app, dịch vụ hoặc gói..."
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FULFILLMENT_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setActiveChip(chip)}
                className={`rounded-full border px-3 py-2 text-xs uppercase tracking-[0.16em] transition ${
                  activeChip === chip
                    ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-200"
                    : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-white/20"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </Panel>

      {filtered.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Chưa có kết quả phù hợp"
          description="Thử tên sản phẩm khác hoặc quay về danh sách đầy đủ khi dữ liệu catalog thật được bổ sung thêm."
          href="/"
          cta="Quay về trang chủ"
        />
      )}
    </section>
  );
}
