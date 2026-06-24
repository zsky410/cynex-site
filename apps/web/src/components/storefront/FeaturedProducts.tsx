import Link from "next/link";
import { publicFetch } from "@/lib/api";
import { formatVnd } from "@/lib/utils";

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
  variants: { price: number; status: string }[];
}

const TINTS = [
  "from-cyan-100 via-emerald-50 to-white",
  "from-rose-100 via-orange-50 to-white",
  "from-emerald-100 via-cyan-50 to-white",
  "from-indigo-100 via-sky-50 to-white",
  "from-violet-100 via-fuchsia-50 to-white",
  "from-rose-100 via-pink-50 to-white",
];

function minPrice(variants: ProductCard["variants"]): number | null {
  const active = variants.filter((v) => v.status === "active");
  if (!active.length) return null;
  return Math.min(...active.map((v) => v.price));
}

export async function FeaturedProducts() {
  let products: ProductCard[] = [];
  try {
    products = await publicFetch<ProductCard[]>("/products");
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
    <div className="mt-10 grid gap-6 lg:grid-cols-3">
      {featured.map((product, index) => {
        const price = minPrice(product.variants);
        const tint = TINTS[index % TINTS.length];
        return (
          <article
            key={product.id}
            className="overflow-hidden rounded-[26px] border border-white/70 bg-white shadow-[0_24px_55px_rgba(15,23,42,0.08)] transition hover:-translate-y-1 hover:shadow-[0_28px_70px_rgba(15,23,42,0.12)]"
          >
            <div className={`relative h-40 overflow-hidden bg-gradient-to-br ${tint}`}>
              {product.image?.publicUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={product.image.publicUrl} alt={product.name} className="h-full w-full object-cover" />
              ) : null}
            </div>
            <div className="space-y-4 px-6 py-6">
              <div>
                <h3 className="text-[19px] font-semibold leading-tight tracking-[-0.03em] text-slate-950">
                  {product.name}
                </h3>
                {product.shortDescription && (
                  <p className="mt-2 line-clamp-2 text-[13px] leading-6 text-slate-500">{product.shortDescription}</p>
                )}
              </div>
              <div className="flex items-end justify-between gap-4">
                <p className="text-[24px] font-semibold tracking-[-0.03em] text-sky-900">
                  {price != null ? `Từ ${formatVnd(price)}` : "Liên hệ"}
                </p>
                <Link
                  href={`/products/${product.slug}`}
                  className="text-sm font-semibold text-sky-700 transition hover:text-sky-800"
                >
                  Xem chi tiết
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
