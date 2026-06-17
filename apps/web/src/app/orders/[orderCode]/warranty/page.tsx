"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ApiError, apiFetch, apiUploadFile } from "@/lib/api";

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

  if (error && !order) return <p className="text-red-600">{error}</p>;
  if (!order) return <p>Dang tai...</p>;
  if (!itemId || !selectedItem) {
    return (
      <section className="mx-auto max-w-2xl rounded-2xl border bg-white p-6">
        <p className="text-sm text-slate-600">Khong tim thay san pham trong don hang.</p>
        <Link href={`/orders/${orderCode}`} className="mt-3 inline-block text-sm text-brand">
          Quay lai chi tiet don
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6">
      <div className="rounded-2xl border bg-white p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Ho tro / Bao hanh</p>
        <h1 className="mt-2 text-2xl font-bold">
          {selectedItem.product.name} - {selectedItem.variant.name}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Bao hanh toi da {selectedItem.variant.warrantyDays} ngay. Mo ta loi ro rang va dinh kem anh/PDF neu co.
        </p>
      </div>

      <div className="rounded-2xl border bg-white p-6">
        <label className="mb-2 block text-sm font-medium">Loai su co</label>
        <select
          className="w-full rounded-xl border px-3 py-2"
          value={reason}
          onChange={(e) => setReason(e.target.value as (typeof REASONS)[number]["id"])}
          disabled={busy}
        >
          {REASONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>

        <label className="mb-2 mt-4 block text-sm font-medium">Mo ta</label>
        <textarea
          className="min-h-40 w-full rounded-xl border px-3 py-2"
          placeholder="Mo ta van de, thoi diem phat sinh, ban da thu cach nao..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={busy}
        />

        <label className="mb-2 mt-4 block text-sm font-medium">Dinh kem (toi da 10MB moi tep)</label>
        <input
          className="block w-full text-sm"
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.webp,.pdf,.txt"
          onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          disabled={busy}
        />
        {files.length > 0 && (
          <ul className="mt-3 space-y-1 text-xs text-slate-600">
            {files.map((file) => (
              <li key={`${file.name}-${file.size}`}>{file.name} - {(file.size / 1024).toFixed(1)} KB</li>
            ))}
          </ul>
        )}

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button
            className="rounded-xl bg-brand px-4 py-2 text-white disabled:opacity-60"
            onClick={submit}
            disabled={busy || !message.trim()}
            type="button"
          >
            {busy ? "Dang gui..." : "Gui yeu cau"}
          </button>
          <Link href={`/orders/${orderCode}`} className="rounded-xl border px-4 py-2 text-sm">
            Quay lai don hang
          </Link>
        </div>
      </div>

      {created && (
        <div className="rounded-2xl border bg-emerald-50 p-6">
          <p className="text-sm font-semibold text-emerald-800">Da tao yeu cau #{created.id}</p>
          <p className="mt-1 text-sm text-emerald-700">Trang thai hien tai: {created.status}</p>
          {created.messages[0] && (
            <p className="mt-3 rounded-xl bg-white p-3 text-sm text-slate-700">
              {created.messages[0].message}
            </p>
          )}
          <Link href={`/warranty?id=${created.id}`} className="mt-3 inline-block text-sm text-emerald-800 underline">
            Xem toan bo trao doi
          </Link>
        </div>
      )}
    </section>
  );
}
