import Link from "next/link";

export default function HomePage() {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-10 text-white shadow-lg">
        <h1 className="text-3xl font-bold">App & tài khoản premium, giao nhanh</h1>
        <p className="mt-2 max-w-xl text-indigo-100">
          Spotify, Netflix, Canva, ChatGPT Plus và nhiều hơn nữa. Thanh toán payOS hoặc ví,
          nhận hàng ngay trong lịch sử đơn.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-block rounded-lg bg-white px-5 py-2 font-medium text-indigo-700"
        >
          Xem sản phẩm
        </Link>
      </div>
    </section>
  );
}
