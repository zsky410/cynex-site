import { useEffect, useState } from "react";
import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  Show,
  SimpleShowLayout,
  FunctionField,
  SelectInput,
  useRecordContext,
  useNotify,
  useRefresh,
} from "react-admin";
import { API_URL } from "../config";
import { getToken } from "../authProvider";

const PAYMENT_STATUS = [
  { id: "pending", name: "pending" },
  { id: "paid", name: "paid" },
  { id: "failed", name: "failed" },
  { id: "cancelled", name: "cancelled" },
  { id: "refunded", name: "refunded" },
];

const FULFILLMENT_STATUS = [
  { id: "waiting_payment", name: "waiting_payment" },
  { id: "paid_waiting_admin", name: "paid_waiting_admin" },
  { id: "processing", name: "processing" },
  { id: "assigned", name: "assigned" },
  { id: "delivered", name: "delivered" },
  { id: "failed", name: "failed" },
  { id: "cancelled", name: "cancelled" },
  { id: "refunded", name: "refunded" },
];

const orderFilters = [
  <SelectInput key="ps" source="paymentStatus" choices={PAYMENT_STATUS} alwaysOn />,
  <SelectInput key="fs" source="fulfillmentStatus" choices={FULFILLMENT_STATUS} alwaysOn />,
];

export const OrderList = () => (
  <List filters={orderFilters} sort={{ field: "createdAt", order: "DESC" }}>
    <Datagrid rowClick="show">
      <TextField source="orderCode" />
      <FunctionField label="User" render={(r: any) => r.user?.email} />
      <NumberField source="totalAmount" />
      <TextField source="paymentStatus" />
      <TextField source="fulfillmentStatus" />
      <DateField source="createdAt" showTime />
    </Datagrid>
  </List>
);

async function api(path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(init.headers ?? {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.message ?? res.statusText);
  return body;
}

const ASSIGNABLE = ["paid_waiting_admin", "processing", "assigned"];

// Per-item fulfillment actions: mark processing, assign account/key, manual note,
// preview and send delivery email. Only paid orders are actionable.
function ItemFulfillment({ item }: { item: any }) {
  const notify = useNotify();
  const refresh = useRefresh();
  const f = item.fulfillment;
  const [accounts, setAccounts] = useState<any[]>([]);
  const [keys, setKeys] = useState<any[]>([]);
  const [accountId, setAccountId] = useState("");
  const [keyId, setKeyId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const status: string = f?.status ?? item.status;
  const assignable = ASSIGNABLE.includes(status);

  useEffect(() => {
    if (!assignable) return;
    const filterAcc = JSON.stringify({ productVariantId: item.productVariantId, status: "available" });
    api(`/admin/inventory-accounts?perPage=100&filter=${encodeURIComponent(filterAcc)}`)
      .then((r) => setAccounts(r.data ?? []))
      .catch(() => {});
    api(`/admin/inventory-keys?perPage=100&filter=${encodeURIComponent(filterAcc)}`)
      .then((r) => setKeys(r.data ?? []))
      .catch(() => {});
  }, [assignable, item.productVariantId]);

  if (!f) return <p>Không có fulfillment</p>;

  const run = async (fn: () => Promise<any>) => {
    setBusy(true);
    try {
      await fn();
      notify("Đã cập nhật", { type: "success" });
      refresh();
    } catch (e: any) {
      notify(e.message ?? "Lỗi", { type: "error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 16, marginBottom: 12 }}>
      <p style={{ margin: 0, fontWeight: 600 }}>
        {item.product?.name} — {item.variant?.name}{" "}
        <span style={{ color: "#64748b", fontWeight: 400 }}>
          ({item.fulfillmentType}) · trạng thái: <strong>{status}</strong>
        </span>
      </p>

      {status === "paid_waiting_admin" && (
        <button disabled={busy} onClick={() => run(() => api(`/admin/fulfillments/${f.id}/mark-processing`, { method: "POST" }))}>
          Đánh dấu đang xử lý
        </button>
      )}

      {assignable && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">— Chọn tài khoản kho —</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.username} · {a.accountType} · {a.usedSlots}/{a.maxSlots} · {a.status}
                </option>
              ))}
            </select>
            <button
              disabled={busy || !accountId}
              onClick={() =>
                run(() =>
                  api(`/admin/fulfillments/${f.id}/assign-account`, {
                    method: "POST",
                    body: JSON.stringify({ inventoryAccountId: accountId }),
                  }),
                )
              }
            >
              Gán tài khoản
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select value={keyId} onChange={(e) => setKeyId(e.target.value)}>
              <option value="">— Chọn license key —</option>
              {keys.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.id.slice(0, 8)}… · {k.status}
                </option>
              ))}
            </select>
            <button
              disabled={busy || !keyId}
              onClick={() =>
                run(() =>
                  api(`/admin/fulfillments/${f.id}/assign-key`, {
                    method: "POST",
                    body: JSON.stringify({ inventoryKeyId: keyId }),
                  }),
                )
              }
            >
              Gán key
            </button>
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <textarea
              placeholder="Ghi chú giao thủ công / nâng cấp..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              style={{ flex: 1 }}
            />
            <button
              disabled={busy || !note.trim()}
              onClick={() =>
                run(() =>
                  api(`/admin/fulfillments/${f.id}/manual`, {
                    method: "POST",
                    body: JSON.stringify({ note }),
                  }),
                )
              }
            >
              Lưu ghi chú
            </button>
          </div>
        </div>
      )}

      {(status === "assigned" || status === "delivered") && (
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            disabled={busy}
            onClick={() =>
              run(async () => {
                const r = await api(`/admin/fulfillments/${f.id}/preview-delivery-email`, { method: "POST" });
                setPreview(`Nội dung giao:\n${r.deliveredMessage}\n\n— Email: ${r.subject}`);
              })
            }
          >
            Xem trước
          </button>
          <button
            disabled={busy}
            onClick={() => {
              const confirmResend = status === "delivered" ? window.confirm("Đã giao rồi. Gửi lại email?") : true;
              if (!confirmResend) return;
              run(() =>
                api(`/admin/fulfillments/${f.id}/send-delivery-email`, {
                  method: "POST",
                  body: JSON.stringify({ confirm: status === "delivered" }),
                }),
              );
            }}
          >
            {status === "delivered" ? "Gửi lại email giao" : "Gửi email giao"}
          </button>
        </div>
      )}

      {preview && (
        <pre style={{ whiteSpace: "pre-wrap", background: "#f8fafc", padding: 12, marginTop: 8, borderRadius: 6 }}>
          {preview}
        </pre>
      )}
    </div>
  );
}

function FulfillmentPanel() {
  const order = useRecordContext();
  if (!order?.items?.length) return null;
  const locked = order.paymentStatus !== "paid";
  return (
    <div>
      <h3>Xử lý giao hàng</h3>
      {locked && <p style={{ color: "#b45309" }}>Đơn chưa thanh toán — chưa thể giao.</p>}
      {!locked && order.items.map((it: any) => <ItemFulfillment key={it.id} item={it} />)}
    </div>
  );
}

function RefundOrderBox() {
  const order = useRecordContext<any>();
  const notify = useNotify();
  const refresh = useRefresh();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  if (!order?.id || order.paymentStatus !== "paid") return null;

  async function submit() {
    if (!window.confirm("Hoàn tiền đơn này vào ví khách hàng?")) return;
    setBusy(true);
    try {
      await api(`/admin/orders/${order.id}/refund`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      setReason("");
      notify("Đã hoàn tiền đơn hàng", { type: "success" });
      refresh();
    } catch (e: any) {
      notify(e.message ?? "Lỗi hoàn tiền", { type: "error" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 16, marginBottom: 12 }}>
      <p style={{ marginTop: 0, fontWeight: 600 }}>Hoàn tiền</p>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <textarea
          placeholder="Lý do hoàn tiền (khuyến nghị)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          style={{ flex: 1 }}
        />
        <button disabled={busy} onClick={submit}>
          Hoàn tiền vào ví
        </button>
      </div>
    </div>
  );
}

export const OrderShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="orderCode" />
      <FunctionField label="User" render={(r: any) => `${r.user?.name ?? ""} <${r.user?.email}>`} />
      <NumberField source="totalAmount" />
      <TextField source="paymentStatus" />
      <TextField source="fulfillmentStatus" />
      <DateField source="paidAt" showTime />
      <DateField source="deliveredAt" showTime />
      <RefundOrderBox />
      <FulfillmentPanel />
    </SimpleShowLayout>
  </Show>
);
