import Link from "next/link";
import { Panel } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

export default function CheckoutCancelPage() {
  return (
    <Panel className="mx-auto max-w-2xl text-center">
      <StatusPill label="Payment cancelled" tone="danger" />
      <h1 className="mt-4 text-3xl font-semibold text-white">Đã hủy thanh toán</h1>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        Đơn của bạn vẫn được giữ ở trạng thái chờ thanh toán cho tới khi bạn quay lại hoàn tất.
      </p>
      <Link href="/orders" className="button-primary mt-6">
        Xem đơn của tôi
      </Link>
    </Panel>
  );
}
