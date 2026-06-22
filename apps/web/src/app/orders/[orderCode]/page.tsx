"use client";

import { use, useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import {
  DeliveryPanel,
  OrderCard,
  OrderPageLayout,
  OrderSectionTitle,
  OrderStatusBadge,
  OrderTimeline,
  PaymentMeta,
  PrimaryButton,
  SupportCtaCard,
  formatOrderTitle,
} from "@/components/orders/OrderUi";
import { apiFetch, ApiError } from "@/lib/api";
import { formatVnd } from "@/lib/utils";

interface Item {
  id: string;
  quantity: number;
  totalPrice: number;
  status: string;
  product: { name: string };
  variant: { name: string; warrantyDays: number };
  fulfillment?: { status: string; deliveredMessage?: string | null; deliveredAt?: string | null } | null;
}

interface OrderDetail {
  orderCode: string;
  totalAmount: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
  paidAt?: string | null;
  deliveredAt?: string | null;
  items: Item[];
}

export default function OrderDetailPage({ params }: { params: Promise<{ orderCode: string }> }) {
  const { orderCode } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<OrderDetail>(`/orders/${orderCode}`)
      .then(setOrder)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Không tải được đơn"));
  }, [orderCode]);

  if (error) {
    return (
      <OrderPageLayout backHref="/orders" backLabel="Danh sách đơn hàng" title="Không tìm thấy đơn">
        <p className="text-red-600">{error}</p>
      </OrderPageLayout>
    );
  }

  if (!order) {
    return (
      <OrderPageLayout backHref="/orders" backLabel="Danh sách đơn hàng" title="Đang tải...">
        <div className="h-64 animate-pulse rounded-[20px] bg-white/60" />
      </OrderPageLayout>
    );
  }

  const pendingPay = order.paymentStatus === "pending" && order.fulfillmentStatus === "waiting_payment";
  const isDelivered = order.fulfillmentStatus === "delivered";
  const firstItem = order.items[0];

  return (
    <OrderPageLayout
      backHref="/orders"
      backLabel="Danh sách đơn hàng"
      title={formatOrderTitle(order.orderCode)}
      subtitle={
        <>
          Ngày tạo: {new Date(order.createdAt).toLocaleString("vi-VN")} · <PaymentMeta paymentStatus={order.paymentStatus} />
        </>
      }
      badge={<OrderStatusBadge status={order.fulfillmentStatus} />}
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <OrderCard>
            <OrderSectionTitle>Chi tiết sản phẩm</OrderSectionTitle>
            <ul className="space-y-4">
              {order.items.map((it) => (
                <li key={it.id} className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{it.product.name}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{it.variant.name}</p>
                    {it.quantity > 1 && (
                      <p className="mt-1 text-xs text-slate-400">Số lượng: {it.quantity}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-bold text-slate-900">{formatVnd(it.totalPrice)}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-5">
              <span className="font-medium text-slate-600">Tổng thanh toán</span>
              <span className="text-xl font-bold text-sky-700">{formatVnd(order.totalAmount)}</span>
            </div>
            {pendingPay && (
              <div className="mt-5">
                <PrimaryButton href={`/checkout/${order.orderCode}`} className="w-full">
                  Thanh toán ngay
                </PrimaryButton>
              </div>
            )}
          </OrderCard>

          {isDelivered && (
            <OrderCard>
              <OrderSectionTitle icon={<KeyRound className="h-3.5 w-3.5" />}>
                Thông tin nhận hàng
              </OrderSectionTitle>
              <div className="space-y-5">
                {order.items.map((it) => (
                  <DeliveryPanel
                    key={it.id}
                    productName={it.product.name}
                    variantName={it.variant.name}
                    message={it.fulfillment?.deliveredMessage}
                    warrantyDays={it.variant.warrantyDays}
                    warrantyHref={
                      it.variant.warrantyDays > 0
                        ? `/orders/${order.orderCode}/warranty?item=${it.id}`
                        : undefined
                    }
                  />
                ))}
              </div>
            </OrderCard>
          )}

          {!isDelivered && order.fulfillmentStatus !== "cancelled" && order.fulfillmentStatus !== "refunded" && (
            <OrderCard className="border-dashed">
              <p className="text-sm leading-relaxed text-slate-500">
                Thông tin sản phẩm sẽ hiển thị tại đây sau khi đơn hàng được giao. Bạn sẽ nhận email thông báo khi sẵn sàng.
              </p>
            </OrderCard>
          )}
        </div>

        <aside className="space-y-6">
          <OrderCard>
            <OrderSectionTitle>Trạng thái đơn hàng</OrderSectionTitle>
            <OrderTimeline
              createdAt={order.createdAt}
              paidAt={order.paidAt}
              deliveredAt={order.deliveredAt}
              fulfillmentStatus={order.fulfillmentStatus}
              paymentStatus={order.paymentStatus}
            />
          </OrderCard>

          {isDelivered && firstItem && firstItem.variant.warrantyDays > 0 && (
            <SupportCtaCard orderCode={order.orderCode} itemId={firstItem.id} />
          )}

          {isDelivered && order.items.length > 1 && (
            <p className="text-center text-xs text-slate-400">
              Mỗi sản phẩm có thể mở yêu cầu hỗ trợ riêng trong phần thông tin nhận hàng.
            </p>
          )}
        </aside>
      </div>
    </OrderPageLayout>
  );
}
