import { ProductsExplorer } from "@/components/catalog/products-explorer";
import { publicFetch } from "@/lib/api";
import type { CatalogProductCard } from "@/components/catalog/product-card";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await publicFetch<CatalogProductCard[]>("/products");

  return <ProductsExplorer products={products} />;
}
