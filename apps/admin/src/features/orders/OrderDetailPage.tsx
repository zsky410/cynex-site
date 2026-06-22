import { Button, Card, Col, Descriptions, Input, Row, Select, Space, Typography } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminFetch, getResource, listResource } from "../../lib/admin-api";
import { AsyncState } from "../../components/common/AsyncState";
import { PageHeader } from "../../components/common/PageHeader";
import { StatusTag } from "../../components/common/StatusTag";
import { labels } from "../../lib/labels";
import { notifyError, notifySuccess } from "../../lib/notifications";

type InventoryAccountRecord = {
  id: string;
  username?: string;
  accountType?: string;
  usedSlots?: number;
  maxSlots?: number;
  status?: string;
};

type InventoryKeyRecord = {
  id: string;
  status?: string;
};

type OrderItem = {
  id: string;
  productVariantId: string;
  fulfillmentType: string;
  product?: { name?: string };
  variant?: { name?: string };
  fulfillment?: {
    id: string;
    status: string;
  } | null;
};

type OrderRecord = {
  id: string;
  orderCode: string;
  totalAmount: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  paidAt?: string | null;
  deliveredAt?: string | null;
  user?: { name?: string; email?: string };
  items?: OrderItem[];
};

const ASSIGNABLE = ["paid_waiting_admin", "processing", "assigned"];

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(value),
  );
}

function FulfillmentActions({ item, onDone }: { item: OrderItem; onDone: () => Promise<void> }) {
  const fulfillment = item.fulfillment;
  const [accounts, setAccounts] = useState<InventoryAccountRecord[]>([]);
  const [keys, setKeys] = useState<InventoryKeyRecord[]>([]);
  const [accountId, setAccountId] = useState<string>();
  const [keyId, setKeyId] = useState<string>();
  const [note, setNote] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const status = fulfillment?.status ?? "";
  const assignable = fulfillment && ASSIGNABLE.includes(status);

  useEffect(() => {
    if (!assignable) return;

    const filter = { productVariantId: item.productVariantId, status: "available" };
    Promise.all([
      listResource<InventoryAccountRecord>("inventory-accounts", {
        page: 1,
        perPage: 100,
        filter,
      }),
      listResource<InventoryKeyRecord>("inventory-keys", {
        page: 1,
        perPage: 100,
        filter,
      }),
    ])
      .then(([accountResponse, keyResponse]) => {
        setAccounts(accountResponse.data);
        setKeys(keyResponse.data);
      })
      .catch(() => {});
  }, [assignable, item.productVariantId]);

  if (!fulfillment) {
    return <Typography.Text type="secondary">Không có fulfillment</Typography.Text>;
  }

  async function run(action: () => Promise<unknown>, successMessage: string) {
    setBusy(true);
    try {
      await action();
      notifySuccess(successMessage);
      await onDone();
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Không thể cập nhật fulfillment");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card size="small" style={{ marginTop: 16 }}>
      <Space direction="vertical" size={12} style={{ width: "100%" }}>
        <Typography.Text strong>
          {item.product?.name ?? "Sản phẩm"} - {item.variant?.name ?? "Biến thể"}
        </Typography.Text>
        <Space wrap>
          <StatusTag status={status} label={status} />
          <Typography.Text type="secondary">{item.fulfillmentType}</Typography.Text>
        </Space>

        {status === "paid_waiting_admin" ? (
          <Button
            loading={busy}
            onClick={() =>
              run(
                () => adminFetch(`/admin/fulfillments/${fulfillment.id}/mark-processing`, { method: "POST" }),
                "Đã đánh dấu đang xử lý",
              )
            }
          >
            Đánh dấu đang xử lý
          </Button>
        ) : null}

        {assignable ? (
          <>
            <Space wrap>
              <Select
                style={{ minWidth: 280 }}
                placeholder="Chọn tài khoản kho"
                options={accounts.map((account) => ({
                  value: account.id,
                  label: `${account.username ?? account.id} · ${account.accountType ?? "-"} · ${account.usedSlots ?? 0}/${account.maxSlots ?? 0} · ${account.status ?? "-"}`,
                }))}
                value={accountId}
                onChange={setAccountId}
              />
              <Button
                loading={busy}
                disabled={!accountId}
                onClick={() =>
                  run(
                    () =>
                      adminFetch(`/admin/fulfillments/${fulfillment.id}/assign-account`, {
                        method: "POST",
                        body: JSON.stringify({ inventoryAccountId: accountId }),
                      }),
                    "Đã gán tài khoản",
                  )
                }
              >
                Gán tài khoản
              </Button>
            </Space>

            <Space wrap>
              <Select
                style={{ minWidth: 280 }}
                placeholder="Chọn license key"
                options={keys.map((key) => ({
                  value: key.id,
                  label: `${key.id.slice(0, 8)}… · ${key.status ?? "-"}`,
                }))}
                value={keyId}
                onChange={setKeyId}
              />
              <Button
                loading={busy}
                disabled={!keyId}
                onClick={() =>
                  run(
                    () =>
                      adminFetch(`/admin/fulfillments/${fulfillment.id}/assign-key`, {
                        method: "POST",
                        body: JSON.stringify({ inventoryKeyId: keyId }),
                      }),
                    "Đã gán key",
                  )
                }
              >
                Gán key
              </Button>
            </Space>

            <Space.Compact style={{ width: "100%" }}>
              <Input.TextArea
                rows={2}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Ghi chú giao thủ công / nâng cấp..."
              />
              <Button
                loading={busy}
                disabled={!note.trim()}
                onClick={() =>
                  run(
                    () =>
                      adminFetch(`/admin/fulfillments/${fulfillment.id}/manual`, {
                        method: "POST",
                        body: JSON.stringify({ note }),
                      }),
                    "Đã lưu ghi chú giao hàng",
                  )
                }
              >
                Lưu ghi chú
              </Button>
            </Space.Compact>
          </>
        ) : null}

        {status === "assigned" || status === "delivered" ? (
          <Space wrap>
            <Button
              loading={busy}
              onClick={() =>
                run(
                  async () => {
                    const response = await adminFetch<{
                      deliveredMessage?: string;
                      subject?: string;
                    }>(`/admin/fulfillments/${fulfillment.id}/preview-delivery-email`, {
                      method: "POST",
                    });
                    setPreview(
                      `Nội dung giao:\n${response.deliveredMessage ?? ""}\n\n— Email: ${response.subject ?? ""}`,
                    );
                  },
                  "Đã tải bản xem trước",
                )
              }
            >
              Xem trước email giao
            </Button>
            <Button
              loading={busy}
              onClick={() => {
                if (status === "delivered" && !window.confirm("Đã giao rồi. Gửi lại email?")) {
                  return;
                }

                void run(
                  () =>
                    adminFetch(`/admin/fulfillments/${fulfillment.id}/send-delivery-email`, {
                      method: "POST",
                      body: JSON.stringify({ confirm: status === "delivered" }),
                    }),
                  status === "delivered" ? "Đã gửi lại email giao" : "Đã gửi email giao",
                );
              }}
            >
              {status === "delivered" ? "Gửi lại email giao" : "Gửi email giao"}
            </Button>
          </Space>
        ) : null}

        {preview ? <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{preview}</pre> : null}
      </Space>
    </Card>
  );
}

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [refunding, setRefunding] = useState(false);

  async function loadOrder() {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getResource<OrderRecord>("orders", orderId);
      setOrder(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được đơn hàng");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrder();
  }, [orderId]);

  async function refundOrder() {
    if (!orderId) return;
    if (!window.confirm("Hoàn tiền đơn này vào ví khách hàng?")) return;
    setRefunding(true);
    try {
      await adminFetch(`/admin/orders/${orderId}/refund`, {
        method: "POST",
        body: JSON.stringify({ reason: refundReason }),
      });
      notifySuccess("Đã hoàn tiền đơn hàng");
      setRefundReason("");
      await loadOrder();
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Lỗi hoàn tiền");
    } finally {
      setRefunding(false);
    }
  }

  return (
    <>
      <PageHeader
        title={`${labels.orders}${order?.orderCode ? ` · ${order.orderCode}` : ""}`}
        subtitle="Chi tiết đơn hàng và các thao tác fulfillment giữ nguyên endpoint từ màn hình legacy."
        extra={<Button onClick={() => navigate("/shell/orders")}>Quay lại danh sách</Button>}
      />
      <AsyncState loading={loading} error={error}>
        {order ? (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Card>
              <Descriptions column={{ xs: 1, lg: 2 }} bordered>
                <Descriptions.Item label="Mã đơn">{order.orderCode}</Descriptions.Item>
                <Descriptions.Item label="Người dùng">
                  {order.user?.name ? `${order.user.name} <${order.user.email ?? ""}>` : order.user?.email ?? "-"}
                </Descriptions.Item>
                <Descriptions.Item label="Tổng tiền">
                  {new Intl.NumberFormat("vi-VN").format(order.totalAmount)}đ
                </Descriptions.Item>
                <Descriptions.Item label="Thanh toán">
                  <StatusTag status={order.paymentStatus} label={order.paymentStatus} />
                </Descriptions.Item>
                <Descriptions.Item label="Fulfillment">
                  <StatusTag status={order.fulfillmentStatus} label={order.fulfillmentStatus} />
                </Descriptions.Item>
                <Descriptions.Item label="Đã thanh toán">{formatDate(order.paidAt)}</Descriptions.Item>
                <Descriptions.Item label="Đã giao">{formatDate(order.deliveredAt)}</Descriptions.Item>
              </Descriptions>
            </Card>

            {order.paymentStatus === "paid" ? (
              <Card title="Hoàn tiền">
                <Space.Compact style={{ width: "100%" }}>
                  <Input.TextArea
                    rows={2}
                    value={refundReason}
                    onChange={(event) => setRefundReason(event.target.value)}
                    placeholder="Lý do hoàn tiền (khuyến nghị)"
                  />
                  <Button type="primary" danger loading={refunding} onClick={refundOrder}>
                    Hoàn tiền vào ví
                  </Button>
                </Space.Compact>
              </Card>
            ) : null}

            <Card title="Xử lý giao hàng">
              {order.paymentStatus !== "paid" ? (
                <Typography.Text type="warning">
                  Đơn chưa thanh toán - chưa thể giao.
                </Typography.Text>
              ) : (
                <Row gutter={[16, 16]}>
                  {(order.items ?? []).map((item) => (
                    <Col key={item.id} span={24}>
                      <FulfillmentActions item={item} onDone={loadOrder} />
                    </Col>
                  ))}
                </Row>
              )}
            </Card>
          </Space>
        ) : null}
      </AsyncState>
    </>
  );
}
