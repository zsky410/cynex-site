"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Paperclip } from "lucide-react";
import { ApiError, apiFetch, apiUploadFile } from "@/lib/api";
import { EmptyState } from "@/components/ui/empty-state";
import { FieldLabel, SelectInput, TextArea } from "@/components/ui/form-field";
import { Panel } from "@/components/ui/panel";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusPill } from "@/components/ui/status-pill";

const REASONS = [
  { id: "cannot_login", label: "Khong dang nhap duoc" },
  { id: "wrong_password", label: "Sai mat khau" },
  { id: "key_invalid", label: "Key khong hop le" },
  { id: "premium_missing", label: "Khong co premium" },
  { id: "account_limited", label: "Tai khoan bi gioi han" },
  { id: "need_instruction", label: "Can huong dan" },
  { id: "other", label: "Khac" },
] as const;

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

export default function WarrantyPage({ params }: { params: Promise<{ orderCode: string }> }) {
  const { orderCode } = use(params);
  const searchParams = useSearchParams();
  const itemId = searchParams.get("item");

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [reason, setReason] = useState<(typeof REASONS)[number]["id"]>("cannot_login");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<WarrantyCaseResponse | null>(null);

  useEffect(() => {
    apiFetch<OrderDetail>(`/orders/${orderCode}`)
      .then(setOrder)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Khong tai duoc don hang"));
  }, [orderCode]);

  const selectedItem = useMemo(
    () => order?.items.find((item) => item.id === itemId) ?? null,
    [order?.items, itemId],
  );

  async function submit() {
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
          message,
          attachmentFileIds: attachmentFileIds.length ? attachmentFileIds : undefined,
        }),
      });
      setCreated(createdCase);
      setMessage("");
      setFiles([]);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Khong gui duoc yeu cau bao hanh");
    } finally {
      setBusy(false);
    }
  }

  if (error && !order) return <EmptyState title="Không tải được đơn hàng" description={error} href={`/orders/${orderCode}`} cta="Quay lại chi tiết đơn" />;
  if (!order) return <p className="text-sm text-slate-300">Đang tải form bảo hành...</p>;
  if (!itemId || !selectedItem) {
    return (
      <EmptyState title="Không tìm thấy sản phẩm trong đơn" description="Hãy mở lại trang chi tiết đơn và chọn đúng mục cần hỗ trợ." href={`/orders/${orderCode}`} cta="Quay lại chi tiết đơn" />
    );
  }

  return (
    <section className="space-y-6">
      <SectionHeader
        eyebrow="Warranty request"
        title={`${selectedItem.product.name} - ${selectedItem.variant.name}`}
        description="Mô tả vấn đề rõ ràng và đính kèm bằng chứng nếu có để admin xử lý nhanh hơn."
      />

      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <StatusPill label={`BH ${selectedItem.variant.warrantyDays} ngày`} tone="success" />
            <h1 className="mt-3 text-2xl font-semibold text-white">
              {selectedItem.product.name} - {selectedItem.variant.name}
            </h1>
          </div>
          <Link href={`/orders/${orderCode}`} className="button-secondary">
            Quay lại đơn hàng
          </Link>
        </div>
      </Panel>

      <Panel className="space-y-5">
        <div>
          <FieldLabel>Loại sự cố</FieldLabel>
          <SelectInput
            value={reason}
            onChange={(e) => setReason(e.target.value as (typeof REASONS)[number]["id"])}
            disabled={busy}
          >
            {REASONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </SelectInput>
        </div>

        <div>
          <FieldLabel>Mô tả</FieldLabel>
          <TextArea
            placeholder="Mô tả vấn đề, thời điểm phát sinh, và những gì bạn đã thử..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={busy}
          />
        </div>

        <div>
          <FieldLabel>Dính kèm</FieldLabel>
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
          <ul className="space-y-1 text-xs text-slate-400">
            {files.map((file) => (
              <li key={`${file.name}-${file.size}`}>{file.name} - {(file.size / 1024).toFixed(1)} KB</li>
            ))}
          </ul>
        ) : null}

        {error ? <p className="text-sm text-rose-300">{error}</p> : null}

        <div className="flex flex-wrap gap-3">
          <button
            className="button-primary"
            onClick={submit}
            disabled={busy || !message.trim()}
            type="button"
          >
            {busy ? "Đang gửi..." : "Gửi yêu cầu"}
          </button>
          <Link href={`/orders/${orderCode}`} className="button-secondary">
            Hủy
          </Link>
        </div>
      </Panel>

      {created ? (
        <Panel className="border-emerald-400/16 bg-emerald-400/8">
          <div className="inline-flex items-center gap-2 text-emerald-100">
            <CheckCircle2 className="size-4 text-emerald-300" />
            Đã tạo yêu cầu #{created.id}
          </div>
          <p className="mt-3 text-sm text-emerald-100">Trạng thái hiện tại: {created.status}</p>
          {created.messages[0] ? (
            <div className="mt-4 rounded-2xl border border-white/8 bg-[#08101d] p-4 text-sm text-slate-200">
              {created.messages[0].message}
            </div>
          ) : null}
          <Link href={`/warranty?id=${created.id}`} className="button-secondary mt-4">
            Xem toàn bộ trao đổi
          </Link>
        </Panel>
      ) : null}
    </section>
  );
}
