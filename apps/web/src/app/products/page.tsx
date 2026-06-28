import { publicFetch } from "@/lib/api";
import { PremiumFooter, PremiumHeader } from "@/components/storefront/PremiumChrome";
import { ProductsCatalog } from "@/components/storefront/ProductsCatalog";
import type { StorefrontCategory, StorefrontProduct } from "@/components/storefront/ProductPreviewCard";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    publicFetch<StorefrontProduct[]>("/products"),
    publicFetch<StorefrontCategory[]>("/categories"),
  ]);

  return (
    <div className="home-shell">
      <PremiumHeader activeKey="products" />
      <main className="mx-auto max-w-[1180px] px-5 pb-24 pt-12 lg:px-8 lg:pt-16">
        <section className="max-w-[760px]">
          <h1 className="section-title text-5xl font-semibold leading-[1.06] tracking-[-0.05em] text-slate-950 lg:text-[64px]">
            Tất cả sản phẩm
          </h1>
          <p className="mt-6 max-w-[760px] text-[17px] leading-8 text-slate-500">
            Khám phá các gói dịch vụ premium được tuyển chọn kỹ lưỡng để nâng cao hiệu suất làm việc và giải trí của bạn.
          </p>
        </section>

        <ProductsCatalog products={products} categories={categories} />
      </main>
      <PremiumFooter />
    </div>
  );
}
