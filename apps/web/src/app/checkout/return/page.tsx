import Link from "next/link";
import { CheckCircle2, Clock3 } from "lucide-react";
import { PremiumFooter, PremiumHeader } from "@/components/storefront/PremiumChrome";

export default function CheckoutReturnPage() {
  return (
    <div className="home-shell min-h-screen">
      <PremiumHeader />
      <main className="mx-auto flex max-w-lg flex-col items-center px-5 py-20 text-center lg:px-8">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <CheckCircle2 className="h-8 w-8" />
        </span>
        <h1 className="section-title mt-6 text-3xl font-semibold tracking-[-0.03em] text-slate-950">
          Cảm ơn bạn!
        </h1>
        <p className="mt-4 text-sm leading-7 text-slate-500">
          Thanh toán đang được xác nhận. Trạng thái đơn sẽ cập nhật trong giây lát sau khi SePay gửi webhook.
        </p>
        <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800">
          <Clock3 className="h-3.5 w-3.5" />
          Sau khi thanh toán thành công, đơn chuyển sang trạng thái chờ admin xử lý.
        </p>
        <Link
          href="/orders"
          className="mt-8 inline-flex rounded-xl bg-sky-700 px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(10,116,184,0.25)] transition hover:bg-sky-800"
        >
          Xem đơn của tôi
        </Link>
      </main>
      <PremiumFooter />
    </div>
  );
}
