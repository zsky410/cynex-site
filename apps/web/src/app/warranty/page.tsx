"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Headphones, MessageSquare, Send } from "lucide-react";
import { OrderCard, OrderPageLayout } from "@/components/orders/OrderUi";
import { ApiError, apiFetch, apiUploadFile, getToken } from "@/lib/api";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  open: "Mới tạo",
  waiting_admin: "Chờ admin",
  waiting_customer: "Cần bạn phản hồi",
  processing: "Đang xử lý",
  resolved: "Đã xử lý",
  rejected: "Từ chối",
  closed: "Đã đóng",
};

interface WarrantyListRow {
  id: string;
  status: string;
  reason: string;
  createdAt: string;
  order: { orderCode: string };
  orderItem: {
    product: { name: string };
    variant: { name: string };
  };
  _count: { messages: number };
}

interface WarrantyDetail extends WarrantyListRow {
  adminNote?: string | null;
  messages: {
    id: string;
    authorType: string;
    message: string;
    createdAt: string;
  }[];
}

function WarrantyCasesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");

  const [cases, setCases] = useState<WarrantyListRow[]>([]);
  const [detail, setDetail] = useState<WarrantyDetail | null>(null);
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!getToken()) {
      router.push("/login?next=/warranty");
      return;
    }
    apiFetch<WarrantyListRow[]>("/warranty-cases")
      .then(setCases)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) router.push("/login?next=/warranty");
        else setError(e instanceof ApiError ? e.message : "Không tải được danh sách bảo hành");
      });
  }, [router]);

  const resolvedSelectedId = useMemo(() => selectedId ?? cases[0]?.id ?? null, [selectedId, cases]);

  useEffect(() => {
    if (!resolvedSelectedId) {
      setDetail(null);
      return;
    }
    apiFetch<WarrantyDetail>(`/warranty-cases/${resolvedSelectedId}`)
      .then(setDetail)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Không tải được chi tiết case"));
  }, [resolvedSelectedId]);

  async function reply() {
    if (!detail) return;
    setBusy(true);
    setError(null);
    try {
      const attachmentFileIds: string[] = [];
      for (const file of files) {
        const uploaded = await apiUploadFile(file);
        attachmentFileIds.push(uploaded.id);
      }
      const updated = await apiFetch<WarrantyDetail>(`/warranty-cases/${detail.id}/messages`, {
        method: "POST",
        body: JSON.stringify({
          message,
          attachmentFileIds: attachmentFileIds.length ? attachmentFileIds : undefined,
        }),
      });
      setDetail(updated);
      setCases((rows) =>
        rows.map((row) =>
          row.id === updated.id
            ? { ...row, status: updated.status, _count: { messages: updated.messages.length } }
            : row,
        ),
      );
      setMessage("");
      setFiles([]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Không gửi được phản hồi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <OrderPageLayout
      activeKey="support"
      title="Yêu cầu hỗ trợ / bảo hành"
      subtitle="Theo dõi và phản hồi các case hỗ trợ của bạn."
      backHref="/orders"
      backLabel="Quay lại đơn hàng"
    >
      {error && (
        <p className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          {cases.map((item) => {
            const active = item.id === resolvedSelectedId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => router.push(`/warranty?id=${item.id}`)}
                className={cn(
                  "w-full rounded-[20px] border p-4 text-left transition",
                  active
                    ? "border-sky-300 bg-sky-50 shadow-sm"
                    : "border-slate-200/80 bg-white hover:border-sky-200",
                )}
              >
                <p className="text-sm font-semibold text-slate-900">
                  {item.orderItem.product.name} — {item.orderItem.variant.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">Đơn #{item.order.orderCode}</p>
                <p className="mt-2 text-sm text-sky-800">{STATUS_LABEL[item.status] ?? item.status}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {item._count.messages} tin nhắn · {new Date(item.createdAt).toLocaleString("vi-VN")}
                </p>
              </button>
            );
          })}
          {cases.length === 0 && (
            <OrderCard>
              <div className="flex gap-3">
                <Headphones className="h-5 w-5 shrink-0 text-sky-600" />
                <p className="text-sm text-slate-500">
                  Chưa có yêu cầu nào. Bạn có thể mở case từ trang chi tiết đơn hàng đã giao.
                </p>
              </div>
            </OrderCard>
          )}
        </div>

        <OrderCard>
          {!detail ? (
            <p className="text-sm text-slate-500">Chọn một case để xem chi tiết.</p>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Case</p>
                <h2 className="mt-2 text-xl font-semibold text-slate-900">
                  {detail.orderItem.product.name} — {detail.orderItem.variant.name}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Trạng thái:{" "}
                  <span className="font-semibold text-sky-800">{STATUS_LABEL[detail.status] ?? detail.status}</span>
                </p>
                {detail.adminNote ? (
                  <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                    Ghi chú admin: {detail.adminNote}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3">
                {detail.messages.map((row) => (
                  <div
                    key={row.id}
                    className={cn(
                      "rounded-2xl p-4 text-sm",
                      row.authorType === "admin" ? "border border-sky-100 bg-sky-50" : "bg-slate-50",
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <MessageSquare className="h-3.5 w-3.5" />
                        {row.authorType === "admin" ? "Admin" : "Bạn"}
                      </span>
                      <span>{new Date(row.createdAt).toLocaleString("vi-VN")}</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed text-slate-700">{row.message}</p>
                  </div>
                ))}
              </div>

              {!["resolved", "rejected", "closed"].includes(detail.status) && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                  <label className="mb-2 block text-sm font-medium text-slate-800">Phản hồi thêm</label>
                  <textarea
                    className="min-h-32 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Cập nhật tình trạng mới, kết quả thử lại, ảnh chụp màn hình..."
                    disabled={busy}
                  />
                  <label className="mb-2 mt-4 block text-sm font-medium text-slate-800">Đính kèm thêm</label>
                  <input
                    className="block w-full text-sm text-slate-600"
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.webp,.pdf,.txt"
                    onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                    disabled={busy}
                  />
                  <button
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                    type="button"
                    disabled={busy || !message.trim()}
                    onClick={reply}
                  >
                    <Send className="h-4 w-4" />
                    {busy ? "Đang gửi..." : "Gửi phản hồi"}
                  </button>
                </div>
              )}
            </div>
          )}
        </OrderCard>
      </div>
    </OrderPageLayout>
  );
}

export default function WarrantyCasesPage() {
  return (
    <Suspense
      fallback={
        <OrderPageLayout title="Yêu cầu hỗ trợ / bảo hành" subtitle="Đang tải...">
          <div className="h-40 animate-pulse rounded-[20px] bg-white/60" />
        </OrderPageLayout>
      }
    >
      <WarrantyCasesClient />
    </Suspense>
  );
}
