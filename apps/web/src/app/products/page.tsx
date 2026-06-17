import Link from "next/link";
import { publicFetch } from "@/lib/api";
import { formatVnd } from "@/lib/utils";

interface ProductCard {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string | null;
  variants: { id: string; price: number }[];
}

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await publicFetch<ProductCard[]>("/products");

  return (
    <section>
      <h1 className="mb-6 text-2xl font-bold">Sản phẩm</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((p) => {
          const min = p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : 0;
          return (
            <Link
              key={p.id}
              href={`/products/${p.slug}`}
              className="rounded-xl border bg-white p-5 transition hover:shadow-md"
            >
              <h2 className="font-semibold">{p.name}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-slate-500">{p.shortDescription}</p>
              <p className="mt-3 text-brand">
                Từ <span className="font-bold">{formatVnd(min)}</span>
              </p>
            </Link>
          );
        })}
        {products.length === 0 && <p className="text-slate-500">Chưa có sản phẩm.</p>}
      </div>
    </section>
  );
}
