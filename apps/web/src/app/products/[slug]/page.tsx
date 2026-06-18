import { notFound } from "next/navigation";
import { publicFetch } from "@/lib/api";
import { BuyPanel, type Variant } from "@/components/BuyPanel";

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
    <article className="grid gap-8 lg:grid-cols-2">
      <div>
        <h1 className="text-2xl font-bold">{product!.name}</h1>
        <p className="mt-2 text-slate-500">{product!.shortDescription}</p>
        {product!.description && (
          <p className="mt-4 whitespace-pre-line text-sm text-slate-700">{product!.description}</p>
        )}
      </div>
      <BuyPanel variants={product!.variants} />
    </article>
  );
}
