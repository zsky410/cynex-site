"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LifeBuoy, MessageSquareMore, Paperclip } from "lucide-react";
import { ApiError, apiFetch, apiUploadFile, getToken } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldLabel, TextArea } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusPill } from "@/components/ui/status-pill";

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
    authorId?: string | null;
    message: string;
    createdAt: string;
  }[];
}

function WarrantyCasesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");

  const [cases, setCases] = useState<WarrantyListRow[] | null>(null);
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
      .then((rows) => setCases(rows))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) router.push("/login?next=/warranty");
        else setError(e instanceof ApiError ? e.message : "Khong tai duoc danh sach bao hanh");
      });
  }, [router]);

  const resolvedSelectedId = useMemo(() => selectedId ?? cases?.[0]?.id ?? null, [selectedId, cases]);

  useEffect(() => {
    if (!resolvedSelectedId) {
      setDetail(null);
      return;
    }
    apiFetch<WarrantyDetail>(`/warranty-cases/${resolvedSelectedId}`)
      .then(setDetail)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Khong tai duoc chi tiet case"));
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
        rows
          ? rows.map((row) =>
              row.id === updated.id
                ? {
                    ...row,
                    status: updated.status,
                    _count: { messages: updated.messages.length },
                  }
                : row,
            )
          : rows,
      );
      setMessage("");
      setFiles([]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Khong gui duoc phan hoi");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-6">
      <SectionHeader
        eyebrow="Warranty"
        title="Yêu cầu hỗ trợ / bảo hành"
        description="Danh sách case và toàn bộ trao đổi được gom trong cùng một không gian để bạn không phải chuyển trang liên tục."
        action={
          <Link href="/orders" className="button-secondary">
            Quay lại đơn hàng
          </Link>
        }
      />

      {error ? <Panel className="border-rose-400/20 bg-rose-400/10 text-sm text-rose-100">{error}</Panel> : null}

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <div className="space-y-3">
          {cases?.map((item) => {
            const active = item.id === resolvedSelectedId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => router.push(`/warranty?id=${item.id}`)}
                className={`w-full rounded-[24px] border p-4 text-left transition ${
                  active
                    ? "border-cyan-400/30 bg-cyan-400/10"
                    : "border-white/10 bg-white/[0.04] hover:border-white/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {item.orderItem.product.name} - {item.orderItem.variant.name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">Đơn #{item.order.orderCode}</p>
                  </div>
                  <StatusPill label={STATUS_LABEL[item.status] ?? item.status} tone={item.status === "resolved" ? "success" : item.status === "rejected" ? "danger" : "info"} className="tracking-[0.12em]" />
                </div>
                <p className="mt-3 text-xs text-slate-400">
                  {item._count.messages} tin nhắn · {new Date(item.createdAt).toLocaleString("vi-VN")}
                </p>
              </button>
            );
          })}
          {cases && cases.length === 0 ? (
            <EmptyState
              title="Chưa có yêu cầu nào"
              description="Bạn có thể mở case hỗ trợ trực tiếp từ trang chi tiết đơn hàng đã giao."
              href="/orders"
              cta="Xem đơn hàng"
            />
          ) : null}
        </div>

        <Panel className="min-h-[480px]">
          {!detail ? (
            <div className="flex min-h-[360px] items-center justify-center">
              <EmptyState
                title="Chọn một case để xem chi tiết"
                description="Khu vực này sẽ hiển thị hội thoại, trạng thái xử lý và form phản hồi."
              />
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Case #{detail.id}</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">
                      {detail.orderItem.product.name} - {detail.orderItem.variant.name}
                    </h2>
                  </div>
                  <StatusPill label={STATUS_LABEL[detail.status] ?? detail.status} tone={detail.status === "resolved" ? "success" : detail.status === "rejected" ? "danger" : "info"} />
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  Theo dõi trả lời của admin và cập nhật thêm thông tin mới khi cần.
                </p>
                {detail.adminNote ? (
                  <div className="mt-3 rounded-[20px] border border-white/8 bg-white/[0.04] p-4 text-sm text-slate-200">
                    Ghi chú admin: {detail.adminNote}
                  </div>
                ) : null}
              </div>

              <div className="space-y-3">
                {detail.messages.map((row) => (
                  <div
                    key={row.id}
                    className={`rounded-[24px] p-4 text-sm ${
                      row.authorType === "admin"
                        ? "border border-amber-400/12 bg-amber-400/6"
                        : "border border-white/8 bg-white/[0.04]"
                    }`}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3 text-xs text-slate-400">
                      <span className="inline-flex items-center gap-2">
                        {row.authorType === "admin" ? (
                          <LifeBuoy className="size-3.5 text-amber-300" />
                        ) : (
                          <MessageSquareMore className="size-3.5 text-cyan-300" />
                        )}
                        {row.authorType === "admin" ? "Admin" : "Bạn"}
                      </span>
                      <span>{new Date(row.createdAt).toLocaleString("vi-VN")}</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-6 text-slate-200">{row.message}</p>
                  </div>
                ))}
              </div>

              {!["resolved", "rejected", "closed"].includes(detail.status) ? (
                <div className="rounded-[24px] border border-white/8 bg-[#0c1324] p-4">
                  <FieldLabel hint="Reply composer">Phản hồi thêm</FieldLabel>
                  <TextArea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Cập nhật tình trạng mới, kết quả bạn thử lại, ảnh chụp màn hình..."
                    disabled={busy}
                  />
                  <div className="mt-4">
                    <FieldLabel>Dính kèm thêm</FieldLabel>
                    <label className="flex cursor-pointer items-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                      <Paperclip className="size-4 text-violet-300" />
                      Chọn file PNG, JPG, WEBP, PDF hoặc TXT
                      <input
                        className="hidden"
                        type="file"
                        multiple
                        accept=".png,.jpg,.jpeg,.webp,.pdf,.txt"
                        onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                        disabled={busy}
                      />
                    </label>
                  </div>
                  {files.length > 0 ? (
                    <ul className="mt-3 space-y-1 text-xs text-slate-400">
                      {files.map((file) => (
                        <li key={`${file.name}-${file.size}`}>{file.name} - {(file.size / 1024).toFixed(1)} KB</li>
                      ))}
                    </ul>
                  ) : null}
                  <button
                    className="button-primary mt-4"
                    type="button"
                    disabled={busy || !message.trim()}
                    onClick={reply}
                  >
                    {busy ? "Đang gửi..." : "Gửi phản hồi"}
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </Panel>
      </div>
    </section>
  );
}

export default function WarrantyCasesPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-300">Đang tải hỗ trợ...</p>}>
      <WarrantyCasesClient />
    </Suspense>
  );
}
