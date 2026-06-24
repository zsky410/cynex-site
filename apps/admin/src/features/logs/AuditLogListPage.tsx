import { Button, Form, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AsyncState } from "../../components/common/AsyncState";
import { FilterBar } from "../../components/common/FilterBar";
import { IntegrityWarningCell } from "../../components/common/IntegrityWarningCell";
import { PageHeader } from "../../components/common/PageHeader";
import { ResourceTable } from "../../components/common/ResourceTable";
import { StandardBulkActions } from "../../components/common/StandardBulkActions";
import { useBulkDelete } from "../../components/common/useBulkDelete";
import { useListSelection } from "../../components/common/useListSelection";
import type { IntegrityWarning } from "../../components/common/IntegrityWarningAlert";
import { listResource } from "../../lib/admin-api";
import { getDisplayLabel } from "../../lib/display-labels";
import { labels } from "../../lib/labels";

type AuditLogRecord = {
  id: string;
  action: string;
  actorType?: string | null;
  actorId?: string | null;
  targetType?: string | null;
  targetId?: string | null;
  createdAt: string;
  integrityWarnings: IntegrityWarning[];
};

type AuditFilter = {
  action?: string;
  targetType?: string;
  q?: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default function AuditLogListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm<AuditFilter>();
  const [rows, setRows] = useState<AuditLogRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = Number(searchParams.get("page") ?? "1");
  const perPage = Number(searchParams.get("perPage") ?? "25");
  const currentAction = searchParams.get("action") ?? undefined;
  const currentTargetType = searchParams.get("targetType") ?? undefined;
  const currentQuery = searchParams.get("q") ?? undefined;
  const selection = useListSelection<AuditLogRecord>(searchParams.toString());
  const { deleting, deleteSelected } = useBulkDelete({
    resource: "audit-logs",
    selectedRowKeys: selection.selectedRowKeys,
    onDeleted: (deletedIds) => {
      setRows((currentRows) => currentRows.filter((row) => !deletedIds.includes(row.id)));
      setTotal((currentTotal) => Math.max(0, currentTotal - deletedIds.length));
      selection.clearSelection();
    },
  });

  useEffect(() => {
    form.setFieldsValue({ action: currentAction, targetType: currentTargetType, q: currentQuery });
  }, [currentAction, currentQuery, currentTargetType, form]);

  useEffect(() => {
    setLoading(true);
    const filter: Record<string, unknown> = {};
    if (currentAction) filter.action = currentAction;
    if (currentTargetType) filter.targetType = currentTargetType;
    if (currentQuery) filter.q = currentQuery;
    listResource<AuditLogRecord>("audit-logs", {
      page,
      perPage,
      sort: "createdAt",
      order: "DESC",
      filter,
    })
      .then((response) => {
        setRows(response.data);
        setTotal(response.total);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [currentAction, currentQuery, currentTargetType, page, perPage]);

  const columns = useMemo<ColumnsType<AuditLogRecord>>(
    () => [
      { title: "", key: "integrityWarnings", width: 44, render: (_, record) => <IntegrityWarningCell integrityWarnings={record.integrityWarnings} /> },
      { title: "Hành động", dataIndex: "action", key: "action", render: (value: string) => getDisplayLabel(value) },
      { title: "Loại actor", dataIndex: "actorType", key: "actorType", render: (value?: string | null) => value || "-" },
      { title: "Actor ID", dataIndex: "actorId", key: "actorId", render: (value?: string | null) => value || "-" },
      { title: "Loại target", dataIndex: "targetType", key: "targetType", render: (value?: string | null) => value || "-" },
      { title: "Target ID", dataIndex: "targetId", key: "targetId", render: (value?: string | null) => value || "-" },
      { title: "Tạo lúc", dataIndex: "createdAt", key: "createdAt", render: formatDate },
      {
        title: labels.actions,
        key: "actions",
        render: (_, record) => (
          <Button type="link" onClick={() => navigate(`/shell/audit-logs/${record.id}`)}>
            Chi tiết
          </Button>
        ),
      },
    ],
    [navigate],
  );

  return (
    <>
      <PageHeader title={labels.auditLogs} subtitle="Lịch sử thao tác quản trị và các lần reveal secret." />
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          const params = new URLSearchParams({ page: "1", perPage: String(perPage) });
          if (values.action?.trim()) params.set("action", values.action.trim());
          if (values.targetType?.trim()) params.set("targetType", values.targetType.trim());
          if (values.q?.trim()) params.set("q", values.q.trim());
          setSearchParams(params);
        }}
      >
        <FilterBar onReset={() => { form.resetFields(); setSearchParams(new URLSearchParams({ page: "1", perPage: String(perPage) })); }}>
          <Form.Item label="Hành động" name="action" style={{ marginBottom: 0, minWidth: 180 }}><Input allowClear /></Form.Item>
          <Form.Item label="Loại target" name="targetType" style={{ marginBottom: 0, minWidth: 180 }}><Input allowClear /></Form.Item>
          <Form.Item label={labels.search} name="q" style={{ marginBottom: 0, minWidth: 240 }}><Input allowClear /></Form.Item>
        </FilterBar>
      </Form>
      <AsyncState loading={loading} error={error} empty={!rows.length}>
        <ResourceTable<AuditLogRecord>
          columns={columns}
          rows={rows}
          loading={loading}
          page={page}
          perPage={perPage}
          total={total}
          onChangePage={(nextPage, nextPageSize) => {
            const params = new URLSearchParams({ page: String(nextPage), perPage: String(nextPageSize) });
            if (currentAction) params.set("action", currentAction);
            if (currentTargetType) params.set("targetType", currentTargetType);
            if (currentQuery) params.set("q", currentQuery);
            setSearchParams(params);
          }}
          rowSelection={{
            selectedRowKeys: selection.selectedRowKeys,
            onChange: selection.onSelectionChange,
            toolbar: (
              <StandardBulkActions<AuditLogRecord>
                selectedRows={selection.selectedRows}
                onClear={selection.clearSelection}
                onView={(row) => navigate(`/shell/audit-logs/${row.id}`)}
                onDelete={deleteSelected}
                deleting={deleting}
              />
            ),
          }}
        />
      </AsyncState>
    </>
  );
}
