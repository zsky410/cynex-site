import Link from "next/link";
import { XCircle } from "lucide-react";
import { PremiumFooter, PremiumHeader } from "@/components/storefront/PremiumChrome";

export default function CheckoutCancelPage() {
  return (
    <div className="home-shell min-h-screen">
      <PremiumHeader />
      <main className="mx-auto flex max-w-lg flex-col items-center px-5 py-20 text-center lg:px-8">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
          <XCircle className="h-8 w-8" />
        </span>
        <h1 className="section-title mt-6 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
          Đã hủy thanh toán
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-500">
          Giao dịch chưa hoàn tất. Bạn có thể quay lại đơn hàng và thử thanh toán lại bất cứ lúc nào.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/orders"
            className="inline-flex rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
          >
            Xem đơn của tôi
          </Link>
          <Link
            href="/products"
            className="inline-flex rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:border-sky-200"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      </main>
      <PremiumFooter />
    </div>
  );
}
