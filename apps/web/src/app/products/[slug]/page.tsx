import { notFound } from "next/navigation";
import { CheckCircle2, ShieldCheck, TimerReset } from "lucide-react";
import { publicFetch } from "@/lib/api";
import { BuyPanel, type Variant } from "@/components/BuyPanel";
import { Panel } from "@/components/ui/panel";
import { ProductVisual } from "@/components/ui/product-visual";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusPill } from "@/components/ui/status-pill";

interface ProductDetail {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
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

  return (
    <article className="space-y-8">
      <SectionHeader
        eyebrow="Product detail"
        title={product.name}
        description={product.shortDescription || "Chọn đúng gói, xem rõ cách xử lý và hoàn tất mua hàng trong một trang duy nhất."}
      />

      <div className="grid gap-6 xl:grid-cols-[0.85fr_1fr_0.9fr]">
        <ProductVisual
          title={product.name}
          subtitle={product.shortDescription || "Placeholder visual cho artwork sản phẩm tương lai."}
          className="min-h-[360px]"
        />

        <div className="space-y-5">
          <Panel>
            <StatusPill label="Curated package selection" tone="info" />
            <h1 className="mt-4 text-3xl font-semibold text-white">{product.name}</h1>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {product.description || product.shortDescription || "Mô tả đầy đủ sẽ được bổ sung từ catalog thật sau này."}
            </p>
          </Panel>

          <div className="grid gap-3 sm:grid-cols-3">
            <Panel className="p-4">
              <TimerReset className="size-5 text-cyan-300" />
              <p className="mt-4 text-sm font-medium text-white">Mua nhanh</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">CTA và giá luôn ở gần vùng nhìn chính.</p>
            </Panel>
            <Panel className="p-4">
              <ShieldCheck className="size-5 text-emerald-300" />
              <p className="mt-4 text-sm font-medium text-white">Có bảo hành</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Hiển thị rõ quyền lợi theo từng gói bán.</p>
            </Panel>
            <Panel className="p-4">
              <CheckCircle2 className="size-5 text-violet-300" />
              <p className="mt-4 text-sm font-medium text-white">Rõ trạng thái</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">Không gợi hiểu nhầm rằng hệ thống giao tự động.</p>
            </Panel>
          </div>
        </div>

        <div>
          <BuyPanel variants={product.variants} />
        </div>
      </div>
    </article>
  );
}
