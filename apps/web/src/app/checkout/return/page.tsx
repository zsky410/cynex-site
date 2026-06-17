import Link from "next/link";

export default function CheckoutReturnPage() {
  return (
    <div className="mx-auto max-w-md rounded-xl border bg-white p-6 text-center">
      <h1 className="text-xl font-bold">Cảm ơn bạn!</h1>
      <p className="mt-2 text-slate-600">
        Thanh toán đang được xác nhận. Trạng thái đơn sẽ cập nhật trong giây lát.
      </p>
      <Link href="/orders" className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-white">
        Xem đơn của tôi
      </Link>
    </div>
  );
}
