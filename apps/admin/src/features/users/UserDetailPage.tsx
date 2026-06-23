import { Button, Card, Descriptions, Input, Space, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AsyncState } from "../../components/common/AsyncState";
import { PageHeader } from "../../components/common/PageHeader";
import { StatusTag } from "../../components/common/StatusTag";
import { adminFetch, getResource } from "../../lib/admin-api";
import { labels } from "../../lib/labels";
import { notifyError, notifySuccess } from "../../lib/notifications";

type WalletTxn = {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description?: string | null;
  createdAt: string;
};

type UserOrder = {
  id: string;
  orderCode: string;
  totalAmount: number;
  paymentStatus: string;
  fulfillmentStatus: string;
};

type UserRecord = {
  id: string;
  email: string;
  name?: string | null;
  walletBalance: number;
  isLocked: boolean;
  walletTxns?: WalletTxn[];
  orders?: UserOrder[];
};

function formatMoney(value: number) {
  return `${new Intl.NumberFormat("vi-VN").format(value)}đ`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(value),
  );
}

export default function UserDetailPage() {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [record, setRecord] = useState<UserRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function loadUser() {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getResource<UserRecord>("users", userId);
      setRecord(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được người dùng");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadUser();
  }, [userId]);

  async function adjustWallet() {
    if (!userId) return;
    setBusy(true);
    try {
      await adminFetch(`/admin/users/${userId}/wallet-adjustment`, {
        method: "POST",
        body: JSON.stringify({ amount: Number(amount), reason }),
      });
      notifySuccess("Đã điều chỉnh ví");
      setAmount("");
      setReason("");
      await loadUser();
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Lỗi điều chỉnh ví");
    } finally {
      setBusy(false);
    }
  }

  const walletColumns = useMemo<ColumnsType<WalletTxn>>(
    () => [
      { title: "Loại", dataIndex: "type", key: "type" },
      { title: "Số tiền", dataIndex: "amount", key: "amount", render: formatMoney },
      { title: "Số dư sau", dataIndex: "balanceAfter", key: "balanceAfter", render: formatMoney },
      { title: "Mô tả", dataIndex: "description", key: "description", render: (value?: string | null) => value || "-" },
      { title: "Thời gian", dataIndex: "createdAt", key: "createdAt", render: formatDate },
    ],
    [],
  );

  const orderColumns = useMemo<ColumnsType<UserOrder>>(
    () => [
      { title: "Mã đơn", dataIndex: "orderCode", key: "orderCode" },
      { title: "Tổng tiền", dataIndex: "totalAmount", key: "totalAmount", render: formatMoney },
      { title: "Thanh toán", dataIndex: "paymentStatus", key: "paymentStatus", render: (value: string) => <StatusTag status={value} /> },
      { title: "Giao hàng", dataIndex: "fulfillmentStatus", key: "fulfillmentStatus", render: (value: string) => <StatusTag status={value} /> },
      {
        title: labels.actions,
        key: "actions",
        render: (_, order) => (
          <Button type="link" onClick={() => navigate(`/shell/orders/${order.id}`)}>
            Xem đơn
          </Button>
        ),
      },
    ],
    [navigate],
  );

  return (
    <>
      <PageHeader
        title={`${labels.users}${record?.email ? ` · ${record.email}` : ""}`}
        subtitle="Thông tin người dùng, lịch sử ví và các đơn hàng liên quan."
        extra={
          <Space>
            <Button onClick={() => navigate("/shell/users")}>Quay lại</Button>
            {userId ? <Button type="primary" onClick={() => navigate(`/shell/users/${userId}/edit`)}>{labels.edit}</Button> : null}
          </Space>
        }
      />
      <AsyncState loading={loading} error={error}>
        {record ? (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Card>
              <Descriptions bordered column={{ xs: 1, lg: 2 }}>
                <Descriptions.Item label="Email">{record.email}</Descriptions.Item>
                <Descriptions.Item label="Tên">{record.name || "-"}</Descriptions.Item>
                <Descriptions.Item label="Số dư ví">{formatMoney(record.walletBalance)}</Descriptions.Item>
                <Descriptions.Item label="Đăng nhập">
                  <StatusTag status={record.isLocked ? "locked" : "active"} label={record.isLocked ? "Đã khóa" : "Hoạt động"} />
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Điều chỉnh ví">
              <Space.Compact style={{ width: "100%" }}>
                <Input
                  type="number"
                  placeholder="Số tiền, âm = trừ tiền"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
                <Input
                  placeholder="Lý do bắt buộc"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
                <Button type="primary" loading={busy} disabled={!amount || !reason.trim()} onClick={adjustWallet}>
                  Áp dụng
                </Button>
              </Space.Compact>
              <Typography.Paragraph type="secondary" style={{ marginTop: 12, marginBottom: 0 }}>
                Điều chỉnh ví, dùng số âm nếu cần trừ tiền.
              </Typography.Paragraph>
            </Card>

            <Card title="Lịch sử ví">
              <Table rowKey="id" columns={walletColumns} dataSource={record.walletTxns ?? []} pagination={false} scroll={{ x: true }} />
            </Card>

            <Card title="Đơn hàng">
              <Table rowKey="id" columns={orderColumns} dataSource={record.orders ?? []} pagination={false} scroll={{ x: true }} />
            </Card>
          </Space>
        ) : null}
      </AsyncState>
    </>
  );
}
