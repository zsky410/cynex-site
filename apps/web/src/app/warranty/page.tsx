"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiError, apiFetch, apiUploadFile, getToken } from "@/lib/api";

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
      .then((rows) => setCases(rows))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) router.push("/login?next=/warranty");
        else setError(e instanceof ApiError ? e.message : "Khong tai duoc danh sach bao hanh");
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
        rows.map((row) =>
          row.id === updated.id
            ? {
                ...row,
                status: updated.status,
                _count: { messages: updated.messages.length },
              }
            : row,
        ),
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
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Warranty</p>
          <h1 className="mt-2 text-2xl font-bold">Yeu cau ho tro / bao hanh</h1>
        </div>
        <Link href="/orders" className="text-sm text-brand">
          Quay lai don hang
        </Link>
      </div>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
        <div className="space-y-3">
          {cases.map((item) => {
            const active = item.id === resolvedSelectedId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => router.push(`/warranty?id=${item.id}`)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  active ? "border-brand bg-amber-50" : "bg-white hover:border-slate-300"
                }`}
              >
                <p className="text-sm font-semibold">
                  {item.orderItem.product.name} - {item.orderItem.variant.name}
                </p>
                <p className="mt-1 text-xs text-slate-500">Don #{item.order.orderCode}</p>
                <p className="mt-2 text-sm text-slate-700">{STATUS_LABEL[item.status] ?? item.status}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item._count.messages} tin nhan · {new Date(item.createdAt).toLocaleString("vi-VN")}
                </p>
              </button>
            );
          })}
          {cases.length === 0 && (
            <div className="rounded-2xl border bg-white p-6 text-sm text-slate-500">
              Chua co yeu cau nao. Ban co the mo case tu trang chi tiet don hang da giao.
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-white p-6">
          {!detail ? (
            <p className="text-sm text-slate-500">Chon mot case de xem chi tiet.</p>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Case #{detail.id}</p>
                <h2 className="mt-2 text-xl font-semibold">
                  {detail.orderItem.product.name} - {detail.orderItem.variant.name}
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  Trang thai: <span className="font-medium">{STATUS_LABEL[detail.status] ?? detail.status}</span>
                </p>
                {detail.adminNote ? (
                  <p className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                    Ghi chu admin: {detail.adminNote}
                  </p>
                ) : null}
              </div>

              <div className="space-y-3">
                {detail.messages.map((row) => (
                  <div
                    key={row.id}
                    className={`rounded-2xl p-4 text-sm ${
                      row.authorType === "admin" ? "bg-amber-50" : "bg-slate-50"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-500">
                      <span>{row.authorType === "admin" ? "Admin" : "Ban"}</span>
                      <span>{new Date(row.createdAt).toLocaleString("vi-VN")}</span>
                    </div>
                    <p className="whitespace-pre-wrap">{row.message}</p>
                  </div>
                ))}
              </div>

              {!["resolved", "rejected", "closed"].includes(detail.status) && (
                <div className="rounded-2xl border bg-slate-50 p-4">
                  <label className="mb-2 block text-sm font-medium">Phan hoi them</label>
                  <textarea
                    className="min-h-32 w-full rounded-xl border bg-white px-3 py-2"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Cap nhat tinh trang moi, ket qua ban thu lai, anh chup man hinh..."
                    disabled={busy}
                  />
                  <label className="mb-2 mt-4 block text-sm font-medium">Dinh kem them</label>
                  <input
                    className="block w-full text-sm"
                    type="file"
                    multiple
                    accept=".png,.jpg,.jpeg,.webp,.pdf,.txt"
                    onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                    disabled={busy}
                  />
                  {files.length > 0 ? (
                    <ul className="mt-3 space-y-1 text-xs text-slate-600">
                      {files.map((file) => (
                        <li key={`${file.name}-${file.size}`}>{file.name} - {(file.size / 1024).toFixed(1)} KB</li>
                      ))}
                    </ul>
                  ) : null}
                  <button
                    className="mt-4 rounded-xl bg-brand px-4 py-2 text-white disabled:opacity-60"
                    type="button"
                    disabled={busy || !message.trim()}
                    onClick={reply}
                  >
                    {busy ? "Dang gui..." : "Gui phan hoi"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export default function WarrantyCasesPage() {
  return (
    <Suspense fallback={<p>Dang tai...</p>}>
      <WarrantyCasesClient />
    </Suspense>
  );
}
