import { Button, Card, Descriptions, Input, Row, Col, Space, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AsyncState } from "../../components/common/AsyncState";
import { PageHeader } from "../../components/common/PageHeader";
import { StatusTag } from "../../components/common/StatusTag";
import { adminFetch, getResource } from "../../lib/admin-api";
import { getDisplayLabel } from "../../lib/display-labels";
import { labels } from "../../lib/labels";
import { notifyError, notifySuccess } from "../../lib/notifications";

type WarrantyMessage = {
  id: string;
  authorType?: string;
  authorId?: string;
  message: string;
  createdAt: string;
};

type WarrantyRecord = {
  id: string;
  status: string;
  reason: string;
  adminNote?: string | null;
  createdAt: string;
  closedAt?: string | null;
  user?: { email?: string };
  order?: { orderCode?: string };
  orderItem?: { product?: { name?: string }; variant?: { name?: string } };
  source?: { name?: string };
  sourceOrder?: { id?: string };
  inventoryAccount?: { id?: string; username?: string };
  inventoryKey?: { id?: string };
  messages?: WarrantyMessage[];
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default function WarrantyDetailPage() {
  const navigate = useNavigate();
  const { warrantyId } = useParams();
  const [record, setRecord] = useState<WarrantyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [accountId, setAccountId] = useState("");
  const [keyId, setKeyId] = useState("");
  const [busy, setBusy] = useState<null | "reply" | "account" | "key">(null);

  async function loadRecord() {
    if (!warrantyId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await getResource<WarrantyRecord>("warranty-cases", warrantyId);
      setRecord(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được case bảo hành");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRecord();
  }, [warrantyId]);

  async function run(kind: "reply" | "account" | "key", action: () => Promise<void>, successMessage: string) {
    setBusy(kind);
    try {
      await action();
      notifySuccess(successMessage);
      if (kind === "reply") setReplyMessage("");
      if (kind === "account") setAccountId("");
      if (kind === "key") setKeyId("");
      await loadRecord();
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Không thể cập nhật case bảo hành");
    } finally {
      setBusy(null);
    }
  }

  const messageColumns = useMemo<ColumnsType<WarrantyMessage>>(
    () => [
      { title: "Loại tác giả", dataIndex: "authorType", key: "authorType" },
      { title: "Author ID", dataIndex: "authorId", key: "authorId" },
      { title: "Nội dung", dataIndex: "message", key: "message" },
      { title: "Tạo lúc", dataIndex: "createdAt", key: "createdAt", render: (value: string) => formatDate(value) },
    ],
    [],
  );

  return (
    <>
      <PageHeader
        title={`${labels.warranty}${record?.id ? ` · ${record.id}` : ""}`}
        subtitle="Chi tiết case bảo hành, phản hồi khách hàng và thay thế asset."
        extra={
          <Space>
            <Button onClick={() => navigate("/shell/warranty")}>Quay lại</Button>
            {warrantyId ? <Button type="primary" onClick={() => navigate(`/shell/warranty/${warrantyId}/edit`)}>{labels.edit}</Button> : null}
          </Space>
        }
      />
      <AsyncState loading={loading} error={error}>
        {record ? (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Card>
              <Descriptions bordered column={{ xs: 1, lg: 2 }}>
                <Descriptions.Item label="ID">{record.id}</Descriptions.Item>
                <Descriptions.Item label={labels.status}><StatusTag status={record.status} /></Descriptions.Item>
                <Descriptions.Item label="Lý do">{getDisplayLabel(record.reason)}</Descriptions.Item>
                <Descriptions.Item label="Ghi chú admin">{record.adminNote || "-"}</Descriptions.Item>
                <Descriptions.Item label="Người dùng">{record.user?.email || "-"}</Descriptions.Item>
                <Descriptions.Item label="Đơn hàng">{record.order?.orderCode || "-"}</Descriptions.Item>
                <Descriptions.Item label="Sản phẩm">{record.orderItem?.product?.name || "-"}</Descriptions.Item>
                <Descriptions.Item label="Biến thể">{record.orderItem?.variant?.name || "-"}</Descriptions.Item>
                <Descriptions.Item label="Nguồn cung">{record.source?.name || "-"}</Descriptions.Item>
                <Descriptions.Item label="Source order ID">{record.sourceOrder?.id || "-"}</Descriptions.Item>
                <Descriptions.Item label="Tài khoản kho">{record.inventoryAccount?.username || record.inventoryAccount?.id || "-"}</Descriptions.Item>
                <Descriptions.Item label="Inventory key ID">{record.inventoryKey?.id || "-"}</Descriptions.Item>
                <Descriptions.Item label="Tạo lúc">{formatDate(record.createdAt)}</Descriptions.Item>
                <Descriptions.Item label="Đóng lúc">{formatDate(record.closedAt)}</Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Phản hồi cho khách hàng">
              <Space.Compact style={{ width: "100%" }}>
                <Input.TextArea rows={3} value={replyMessage} onChange={(event) => setReplyMessage(event.target.value)} placeholder="Nội dung phản hồi" />
                <Button
                  type="primary"
                  loading={busy === "reply"}
                  disabled={!replyMessage.trim()}
                  onClick={() =>
                    run(
                      "reply",
                      () =>
                        adminFetch(`/admin/warranty-cases/${record.id}/messages`, {
                          method: "POST",
                          body: JSON.stringify({ message: replyMessage }),
                        }).then(() => undefined),
                      "Đã gửi phản hồi",
                    )
                  }
                >
                  Gửi
                </Button>
              </Space.Compact>
            </Card>

            <Card title="Thay tài khoản / key">
              <Row gutter={[16, 16]}>
                <Col span={24}>
                  <Space.Compact style={{ width: "100%" }}>
                    <Input value={accountId} onChange={(event) => setAccountId(event.target.value)} placeholder="Inventory account ID mới" />
                    <Button
                      loading={busy === "account"}
                      disabled={!accountId.trim()}
                      onClick={() =>
                        run(
                          "account",
                          () =>
                            adminFetch(`/admin/warranty-cases/${record.id}/replace-account`, {
                              method: "POST",
                              body: JSON.stringify({ inventoryAccountId: accountId }),
                            }).then(() => undefined),
                          "Đã thay account cho case",
                        )
                      }
                    >
                      Thay tài khoản
                    </Button>
                  </Space.Compact>
                </Col>
                <Col span={24}>
                  <Space.Compact style={{ width: "100%" }}>
                    <Input value={keyId} onChange={(event) => setKeyId(event.target.value)} placeholder="Inventory key ID mới" />
                    <Button
                      loading={busy === "key"}
                      disabled={!keyId.trim()}
                      onClick={() =>
                        run(
                          "key",
                          () =>
                            adminFetch(`/admin/warranty-cases/${record.id}/replace-key`, {
                              method: "POST",
                              body: JSON.stringify({ inventoryKeyId: keyId }),
                            }).then(() => undefined),
                          "Đã thay key cho case",
                        )
                      }
                    >
                      Thay key
                    </Button>
                  </Space.Compact>
                </Col>
              </Row>
            </Card>

            <Card title="Tin nhắn">
              <Table rowKey="id" columns={messageColumns} dataSource={record.messages ?? []} pagination={false} scroll={{ x: true }} />
            </Card>
          </Space>
        ) : null}
      </AsyncState>
    </>
  );
}
