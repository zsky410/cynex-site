import { Button, Card, Descriptions } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AsyncState } from "../../components/common/AsyncState";
import { PageHeader } from "../../components/common/PageHeader";
import { StatusTag } from "../../components/common/StatusTag";
import { getResource } from "../../lib/admin-api";
import { labels } from "../../lib/labels";

type EmailLogRecord = {
  id: string;
  type: string;
  status: string;
  toEmail?: string | null;
  subject?: string | null;
  providerMessageId?: string | null;
  errorMessage?: string | null;
  dedupeKey?: string | null;
  bodySnapshot?: string | null;
  sentAt?: string | null;
  createdAt: string;
  user?: { email?: string };
  order?: { orderCode?: string };
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default function EmailLogDetailPage() {
  const navigate = useNavigate();
  const { emailLogId } = useParams();
  const [record, setRecord] = useState<EmailLogRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!emailLogId) return;
    getResource<EmailLogRecord>("email-logs", emailLogId)
      .then((response) => setRecord(response.data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [emailLogId]);

  return (
    <>
      <PageHeader title={`${labels.emailLogs}${record?.id ? ` · ${record.id}` : ""}`} subtitle="Chi tiết bản ghi gửi email." extra={<Button onClick={() => navigate("/shell/email-logs")}>Quay lại</Button>} />
      <AsyncState loading={loading} error={error}>
        {record ? (
          <Card>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Loại email">{record.type}</Descriptions.Item>
              <Descriptions.Item label={labels.status}><StatusTag status={record.status} /></Descriptions.Item>
              <Descriptions.Item label="Người nhận">{record.toEmail || "-"}</Descriptions.Item>
              <Descriptions.Item label="Tiêu đề">{record.subject || "-"}</Descriptions.Item>
              <Descriptions.Item label="Người dùng">{record.user?.email || "-"}</Descriptions.Item>
              <Descriptions.Item label="Đơn hàng">{record.order?.orderCode || "-"}</Descriptions.Item>
              <Descriptions.Item label="Provider message ID">{record.providerMessageId || "-"}</Descriptions.Item>
              <Descriptions.Item label="Thông báo lỗi">{record.errorMessage || "-"}</Descriptions.Item>
              <Descriptions.Item label="Dedupe key">{record.dedupeKey || "-"}</Descriptions.Item>
              <Descriptions.Item label="Nội dung snapshot"><pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{record.bodySnapshot || "-"}</pre></Descriptions.Item>
              <Descriptions.Item label="Gửi lúc">{formatDate(record.sentAt)}</Descriptions.Item>
              <Descriptions.Item label="Tạo lúc">{formatDate(record.createdAt)}</Descriptions.Item>
            </Descriptions>
          </Card>
        ) : null}
      </AsyncState>
    </>
  );
}
