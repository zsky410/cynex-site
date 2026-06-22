"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CloudUpload, Send } from "lucide-react";
import { OrderCard, OrderPageLayout } from "@/components/orders/OrderUi";
import { ApiError, apiFetch, apiUploadFile } from "@/lib/api";
import { WARRANTY_REASON_LABEL, WARRANTY_REASONS, type WarrantyReason } from "@/lib/status";
import { cn } from "@/lib/utils";

const REASONS = WARRANTY_REASONS;

interface OrderItem {
  id: string;
  status: string;
  product: { name: string };
  variant: { name: string; warrantyDays: number };
  fulfillment?: { status: string } | null;
}

interface OrderDetail {
  id: string;
  orderCode: string;
  items: OrderItem[];
}

interface WarrantyCaseResponse {
  id: string;
  status: string;
  messages: { message: string; createdAt: string }[];
}

export default function OrderWarrantyPage({ params }: { params: Promise<{ orderCode: string }> }) {
  const { orderCode } = use(params);
  const searchParams = useSearchParams();
  const itemId = searchParams.get("item");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [reason, setReason] = useState<WarrantyReason>("cannot_login");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<WarrantyCaseResponse | null>(null);

  useEffect(() => {
    apiFetch<OrderDetail>(`/orders/${orderCode}`)
      .then(setOrder)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Không tải được đơn hàng"));
  }, [orderCode]);

  const selectedItem = useMemo(
    () => order?.items.find((item) => item.id === itemId) ?? null,
    [order?.items, itemId],
  );

  function addFiles(incoming: FileList | File[]) {
    setFiles((prev) => {
      const next = [...prev];
      for (const file of incoming) {
        if (next.length >= 10) break;
        next.push(file);
      }
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!order || !selectedItem) return;
    setBusy(true);
    setError(null);
    try {
      const attachmentFileIds: string[] = [];
      for (const file of files) {
        const uploaded = await apiUploadFile(file);
        attachmentFileIds.push(uploaded.id);
      }

      const createdCase = await apiFetch<WarrantyCaseResponse>("/warranty-cases", {
        method: "POST",
        body: JSON.stringify({
          orderId: order.id,
          orderItemId: selectedItem.id,
          reason,
          message: message.trim(),
          attachmentFileIds: attachmentFileIds.length ? attachmentFileIds : undefined,
        }),
      });
      setCreated(createdCase);
      setMessage("");
      setFiles([]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Không gửi được yêu cầu hỗ trợ");
    } finally {
      setBusy(false);
    }
  }

  if (error && !order) {
    return (
      <OrderPageLayout activeKey="support" backHref="/orders" backLabel="Danh sách đơn hàng" title="Lỗi">
        <p className="text-red-600">{error}</p>
      </OrderPageLayout>
    );
  }

  if (!order) {
    return (
      <OrderPageLayout activeKey="support" backHref={`/orders/${orderCode}`} backLabel="Chi tiết đơn hàng" title="Đang tải...">
        <div className="h-64 animate-pulse rounded-[20px] bg-white/60" />
      </OrderPageLayout>
    );
  }

  if (!itemId || !selectedItem) {
    return (
      <OrderPageLayout activeKey="support" backHref={`/orders/${orderCode}`} backLabel="Chi tiết đơn hàng" title="Không tìm thấy sản phẩm">
        <OrderCard>
          <p className="text-sm text-slate-600">Không tìm thấy sản phẩm trong đơn hàng.</p>
          <Link href={`/orders/${orderCode}`} className="mt-4 inline-block text-sm font-semibold text-sky-700">
            Quay lại chi tiết đơn
          </Link>
        </OrderCard>
      </OrderPageLayout>
    );
  }

  if (created) {
    return (
      <OrderPageLayout
        activeKey="support"
        backHref={`/orders/${orderCode}`}
        backLabel="Chi tiết đơn hàng"
        title="Đã gửi yêu cầu hỗ trợ"
        subtitle={`Mã yêu cầu: ${created.id}`}
      >
        <OrderCard className="border-emerald-200 bg-emerald-50/50">
          <p className="font-semibold text-emerald-800">Yêu cầu của bạn đã được ghi nhận</p>
          <p className="mt-2 text-sm text-emerald-700">Trạng thái: {created.status}</p>
          {created.messages[0] && (
            <p className="mt-4 rounded-xl bg-white p-4 text-sm text-slate-700">{created.messages[0].message}</p>
          )}
          <Link href={`/warranty?id=${created.id}`} className="mt-5 inline-flex text-sm font-semibold text-emerald-800 underline">
            Xem toàn bộ trao đổi →
          </Link>
        </OrderCard>
      </OrderPageLayout>
    );
  }

  return (
    <OrderPageLayout
      activeKey="support"
      backHref={`/orders/${orderCode}`}
      backLabel="Chi tiết đơn hàng"
      title="Gửi yêu cầu hỗ trợ"
      subtitle="Mô tả sự cố rõ ràng để đội ngũ Cynex hỗ trợ bạn nhanh nhất."
    >
      <div className="mx-auto max-w-[640px]">
        <OrderCard className="border-t-4 border-t-sky-600">
          <div className="mb-6 rounded-xl bg-slate-50 px-4 py-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Đơn hàng</p>
            <p className="mt-1 font-semibold text-slate-800">#{order.orderCode}</p>
            <p className="mt-2 text-slate-600">
              {selectedItem.product.name} — {selectedItem.variant.name}
            </p>
            <p className="mt-1 text-xs text-slate-400">Bảo hành tối đa {selectedItem.variant.warrantyDays} ngày</p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div>
              <label htmlFor="reason" className="mb-1.5 block text-sm font-medium text-slate-700">
                Lý do hỗ trợ <span className="text-red-500">*</span>
              </label>
              <select
                id="reason"
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                value={reason}
                onChange={(e) => setReason(e.target.value as WarrantyReason)}
                disabled={busy}
              >
                {REASONS.map((id) => (
                  <option key={id} value={id}>
                    {WARRANTY_REASON_LABEL[id]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="message" className="mb-1.5 block text-sm font-medium text-slate-700">
                Mô tả chi tiết <span className="text-red-500">*</span>
              </label>
              <textarea
                id="message"
                className="min-h-36 w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                placeholder="Mô tả vấn đề, thời điểm phát sinh, bạn đã thử cách nào..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                disabled={busy}
                required
                maxLength={4000}
              />
            </div>

            <div>
              <p className="mb-1.5 text-sm font-medium text-slate-700">Tệp đính kèm</p>
              <div
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
                }}
                className={cn(
                  "cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 text-center transition",
                  dragOver ? "border-sky-400 bg-sky-50/50" : "border-slate-200 hover:border-sky-300",
                )}
              >
                <CloudUpload className="mx-auto h-8 w-8 text-sky-500" />
                <p className="mt-3 text-sm font-medium text-slate-700">Kéo thả file vào đây hoặc chọn file</p>
                <p className="mt-1 text-xs text-slate-400">JPG, PNG, PDF, TXT — tối đa 10MB mỗi tệp</p>
              </div>
              <input
                ref={fileInputRef}
                className="hidden"
                type="file"
                multiple
                accept=".png,.jpg,.jpeg,.webp,.pdf,.txt"
                onChange={(e) => {
                  if (e.target.files?.length) addFiles(e.target.files);
                  e.target.value = "";
                }}
                disabled={busy}
              />
              {files.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-slate-600">
                  {files.map((file) => (
                    <li key={`${file.name}-${file.size}`}>
                      {file.name} — {(file.size / 1024).toFixed(1)} KB
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </p>
            )}

            <div className="flex items-center justify-between gap-4 pt-2">
              <Link href={`/orders/${orderCode}`} className="text-sm font-medium text-slate-500 hover:text-slate-700">
                Hủy
              </Link>
              <button
                type="submit"
                disabled={busy || !message.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-700 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(10,116,184,0.25)] transition hover:bg-sky-800 disabled:opacity-60"
              >
                {busy ? "Đang gửi..." : "Gửi yêu cầu"}
                {!busy && <Send className="h-4 w-4" />}
              </button>
            </div>
          </form>
        </OrderCard>

        <p className="mt-8 text-center text-sm text-slate-500">
          Cần hỗ trợ khẩn cấp?{" "}
          <Link href="/warranty" className="font-semibold text-sky-700 hover:underline">
            Xem các yêu cầu đã gửi
          </Link>
        </p>
      </div>
    </OrderPageLayout>
  );
}
