import { publicFetch } from "@/lib/api";
import Link from "next/link";
import { ProductPreviewCard, type StorefrontProduct } from "@/components/storefront/ProductPreviewCard";

export async function FeaturedProducts() {
  let products: StorefrontProduct[] = [];
  try {
    products = await publicFetch<StorefrontProduct[]>("/products");
  } catch {
    return (
      <p className="mt-10 text-center text-sm text-slate-500">
        Không tải được sản phẩm.{" "}
        <Link href="/products" className="font-medium text-sky-700 hover:underline">
          Thử lại
        </Link>
      </p>
    );
  }

  const featured = products.slice(0, 6);
  if (!featured.length) {
    return <p className="mt-10 text-center text-sm text-slate-500">Chưa có sản phẩm nào.</p>;
  }

  return (
    <div className="mt-10 grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {featured.map((product) => <ProductPreviewCard key={product.id} product={product} />)}
    </div>
  );
}
