"use client";

import Link from "next/link";
import { ArrowRight, ShieldCheck, Shapes } from "lucide-react";
import { ProductVisual } from "@/components/ui/product-visual";
import { StatusPill } from "@/components/ui/status-pill";
import { cn, formatVnd } from "@/lib/utils";

export interface CatalogProductCard {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  variants: { id: string; price: number; warrantyDays?: number | null }[];
}

export function ProductCard({
  product,
  className,
}: {
  product: CatalogProductCard;
  className?: string;
}) {
  const min = product.variants.length ? Math.min(...product.variants.map((v) => v.price)) : 0;
  const warranty = Math.max(...product.variants.map((v) => v.warrantyDays ?? 0), 0);

  return (
    <Link href={`/products/${product.slug}`} className={cn("panel group flex h-full flex-col gap-5 p-4 md:p-5", className)}>
      <ProductVisual
        title={product.name}
        subtitle={product.shortDescription}
        className="min-h-52 border-white/8 bg-[#0d1323]"
      />
      <div className="flex flex-1 flex-col gap-4">
        <div>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">{product.name}</h3>
            <StatusPill
              tone={warranty > 0 ? "success" : "info"}
              label={warranty > 0 ? `BH ${warranty} ngày` : "Có hỗ trợ"}
            />
          </div>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-300">
            {product.shortDescription || "Giao diện placeholder để sau này gắn dữ liệu sản phẩm thật chi tiết hơn."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="metric-tile">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Giá từ</p>
            <p className="mt-2 text-lg font-semibold text-cyan-300">{formatVnd(min)}</p>
          </div>
          <div className="metric-tile">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Số gói</p>
            <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-white">
              <Shapes className="size-4 text-violet-300" />
              <span>{product.variants.length}</span>
            </div>
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/8 pt-4">
          <div className="inline-flex items-center gap-2 text-sm text-slate-300">
            <ShieldCheck className="size-4 text-emerald-300" />
            Rõ trạng thái xử lý
          </div>
          <span className="inline-flex items-center gap-2 text-sm font-medium text-cyan-300 transition group-hover:translate-x-1">
            Xem gói
            <ArrowRight className="size-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
