import { Button, Card, Descriptions } from "antd";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AsyncState } from "../../components/common/AsyncState";
import { IntegrityWarningAlert, type IntegrityWarning } from "../../components/common/IntegrityWarningAlert";
import { PageHeader } from "../../components/common/PageHeader";
import { getResource } from "../../lib/admin-api";
import { getDisplayLabel } from "../../lib/display-labels";
import { labels } from "../../lib/labels";

type AuditLogRecord = {
  id: string;
  action: string;
  actorType?: string | null;
  actorId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: string | null;
  createdAt: string;
  integrityWarnings?: IntegrityWarning[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default function AuditLogDetailPage() {
  const navigate = useNavigate();
  const { auditLogId } = useParams();
  const [record, setRecord] = useState<AuditLogRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auditLogId) return;
    getResource<AuditLogRecord>("audit-logs", auditLogId)
      .then((response) => setRecord(response.data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [auditLogId]);

  return (
    <>
      <PageHeader title={`${labels.auditLogs}${record?.id ? ` · ${record.id}` : ""}`} subtitle="Chi tiết bản ghi audit." extra={<Button onClick={() => navigate("/shell/audit-logs")}>Quay lại</Button>} />
      <AsyncState loading={loading} error={error}>
        {record ? (
          <Card>
            <IntegrityWarningAlert integrityWarnings={record.integrityWarnings} />
            <Descriptions bordered column={1}>
              <Descriptions.Item label="Hành động">{getDisplayLabel(record.action)}</Descriptions.Item>
              <Descriptions.Item label="Loại actor">{record.actorType || "-"}</Descriptions.Item>
              <Descriptions.Item label="Actor ID">{record.actorId || "-"}</Descriptions.Item>
              <Descriptions.Item label="Loại target">{record.targetType || "-"}</Descriptions.Item>
              <Descriptions.Item label="Target ID">{record.targetId || "-"}</Descriptions.Item>
              <Descriptions.Item label="Địa chỉ IP">{record.ipAddress || "-"}</Descriptions.Item>
              <Descriptions.Item label="User agent">{record.userAgent || "-"}</Descriptions.Item>
              <Descriptions.Item label="Metadata"><pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{record.metadata || "-"}</pre></Descriptions.Item>
              <Descriptions.Item label="Tạo lúc">{formatDate(record.createdAt)}</Descriptions.Item>
            </Descriptions>
          </Card>
        ) : null}
      </AsyncState>
    </>
  );
}
