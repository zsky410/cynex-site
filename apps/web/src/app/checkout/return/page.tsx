import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { StatusPill } from "@/components/ui/status-pill";

export default function CheckoutReturnPage() {
  return (
    <Panel className="mx-auto max-w-2xl text-center">
      <StatusPill label="Payment return" tone="success" />
      <CheckCircle2 className="mx-auto mt-5 size-10 text-emerald-300" />
      <h1 className="mt-4 text-3xl font-semibold text-white">Cảm ơn bạn!</h1>
      <p className="mt-3 text-sm leading-6 text-slate-300">
        Thanh toán đang được xác nhận. Trạng thái đơn sẽ cập nhật trong giây lát.
      </p>
      <Link href="/orders" className="button-primary mt-6">
        Xem đơn của tôi
      </Link>
    </Panel>
  );
}
