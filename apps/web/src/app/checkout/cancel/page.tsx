import Link from "next/link";

export default function CheckoutCancelPage() {
  return (
    <div className="mx-auto max-w-md rounded-xl border bg-white p-6 text-center">
      <h1 className="text-xl font-bold">Đã hủy thanh toán</h1>
      <Link href="/orders" className="mt-4 inline-block rounded-lg bg-brand px-4 py-2 text-white">
        Xem đơn của tôi
      </Link>
    </div>
  );
}
