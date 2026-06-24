import { publicFetch } from "@/lib/api";
import { PremiumFooter, PremiumHeader } from "@/components/storefront/PremiumChrome";
import { ProductsCatalog } from "@/components/storefront/ProductsCatalog";

interface ProductCard {
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
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  variants: { id: string; name: string; price: number; fulfillmentType: string; status: string }[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    publicFetch<ProductCard[]>("/products"),
    publicFetch<Category[]>("/categories"),
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
