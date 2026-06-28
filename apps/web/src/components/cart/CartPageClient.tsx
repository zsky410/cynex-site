"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, ShoppingBag, Trash2 } from "lucide-react";
import { apiFetch, getToken } from "@/lib/api";
import { formatVnd } from "@/lib/utils";
import { convertCartItemsToOrders } from "./cart-checkout";
import { useCart } from "./cart-store";

export function CartPageClient() {
  const router = useRouter();
  const { items, total, removeItem, removeItems, clearCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function checkoutCart() {
    if (!items.length) return;
    if (!getToken()) {
      router.push("/login?next=/cart");
      return;
    }

    setSubmitting(true);
    setError(null);

    const result = await convertCartItemsToOrders(items, (item) =>
      apiFetch<{ orderCode: string }>("/orders", {
        method: "POST",
        body: JSON.stringify({
          productVariantId: item.productVariantId,
          customerInput: item.customerInput,
        }),
      }),
    );

    removeItems(result.created.map((entry) => entry.item.productVariantId));

    if (!result.created.length) {
      setError("Không thể tạo đơn hàng từ giỏ hàng lúc này.");
      setSubmitting(false);
      return;
    }

    if (result.failed.length) {
      router.push(`/orders?created=${result.created.length}&failed=${result.failed.length}`);
      return;
    }

    if (result.created.length === 1) {
      router.push(`/checkout/${result.created[0].orderCode}`);
      return;
    }

    clearCart();
    router.push(`/orders?created=${result.created.length}`);
  }

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className="min-w-0">
        <div className="border-b border-slate-200/70 pb-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.24em] text-sky-700">Giỏ hàng</p>
          <h1 className="mt-3 text-[32px] font-semibold tracking-[-0.05em] text-slate-950 lg:text-[42px] lg:leading-[1.04]">
            Sản phẩm đã chọn
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] text-slate-500 sm:text-base">
            Quản lý các gói dịch vụ bạn muốn thanh toán trong phiên hiện tại.
          </p>
        </div>

        {!items.length ? (
          <div className="mt-8 rounded-[28px] border border-dashed border-slate-200 bg-white/80 px-6 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-sky-50 text-sky-700">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-slate-950">Giỏ hàng đang trống</h2>
            <p className="mt-3 text-sm leading-7 text-slate-500">
              Thêm một vài gói dịch vụ để tiếp tục thanh toán trong phiên này.
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
            >
              Khám phá sản phẩm
            </Link>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {items.map((item) => (
              <article
                key={item.productVariantId}
                className="flex flex-col gap-4 rounded-[22px] border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-lg font-semibold text-slate-950">{item.productName}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.variantName}</p>
                  <Link href={`/products/${item.productSlug}`} className="mt-3 inline-flex text-sm font-medium text-sky-700 transition hover:text-sky-900">
                    Xem lại sản phẩm
                  </Link>
                </div>
                <div className="flex items-center justify-between gap-5 sm:min-w-[210px] sm:justify-end">
                  <p className="text-[22px] font-semibold tracking-[-0.04em] text-sky-700">{formatVnd(item.price)}</p>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productVariantId)}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                    aria-label={`Xóa ${item.productName}`}
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <aside className="xl:sticky xl:top-24">
        <div className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
          <h2 className="text-[24px] font-semibold tracking-[-0.04em] text-slate-950">Tóm tắt giỏ hàng</h2>
          <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
            <span>Số sản phẩm</span>
            <span>{items.length}</span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4">
            <span className="text-base font-semibold text-slate-950">Tổng cộng</span>
            <span className="text-[28px] font-semibold tracking-[-0.05em] text-sky-700">{formatVnd(total)}</span>
          </div>

          {error ? <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p> : null}

          <button
            type="button"
            onClick={() => void checkoutCart()}
            disabled={!items.length || submitting}
            className="mt-6 inline-flex w-full items-center justify-center gap-3 rounded-[20px] bg-sky-700 px-6 py-4 text-base font-semibold text-white transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <ShoppingBag className="h-5 w-5" />}
            Tiến hành thanh toán
          </button>

          <Link
            href="/products"
            className="mt-3 inline-flex w-full items-center justify-center rounded-[20px] border border-slate-200 px-6 py-4 text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </aside>
    </div>
  );
}
