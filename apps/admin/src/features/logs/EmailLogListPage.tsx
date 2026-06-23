import { Button, Form, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AsyncState } from "../../components/common/AsyncState";
import { FilterBar } from "../../components/common/FilterBar";
import { PageHeader } from "../../components/common/PageHeader";
import { ResourceTable } from "../../components/common/ResourceTable";
import { StandardBulkActions } from "../../components/common/StandardBulkActions";
import { useListSelection } from "../../components/common/useListSelection";
import { StatusTag } from "../../components/common/StatusTag";
import { listResource } from "../../lib/admin-api";
import { labels } from "../../lib/labels";

type EmailLogRecord = {
  id: string;
  type: string;
  status: string;
  toEmail?: string | null;
  subject?: string | null;
  sentAt?: string | null;
  createdAt: string;
  order?: { orderCode?: string };
};

type EmailLogFilter = {
  type?: string;
  status?: string;
  q?: string;
};

function formatDate(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default function EmailLogListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm<EmailLogFilter>();
  const [rows, setRows] = useState<EmailLogRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = Number(searchParams.get("page") ?? "1");
  const perPage = Number(searchParams.get("perPage") ?? "25");
  const currentType = searchParams.get("type") ?? undefined;
  const currentStatus = searchParams.get("status") ?? undefined;
  const currentQuery = searchParams.get("q") ?? undefined;
  const selection = useListSelection<EmailLogRecord>(searchParams.toString());

  useEffect(() => {
    form.setFieldsValue({ type: currentType, status: currentStatus, q: currentQuery });
  }, [currentQuery, currentStatus, currentType, form]);

  useEffect(() => {
    setLoading(true);
    const filter: Record<string, unknown> = {};
    if (currentType) filter.type = currentType;
    if (currentStatus) filter.status = currentStatus;
    if (currentQuery) filter.q = currentQuery;
    listResource<EmailLogRecord>("email-logs", {
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
  }, [currentQuery, currentStatus, currentType, page, perPage]);

  const columns = useMemo<ColumnsType<EmailLogRecord>>(
    () => [
      { title: "Loại email", dataIndex: "type", key: "type" },
      { title: labels.status, dataIndex: "status", key: "status", render: (value: string) => <StatusTag status={value} /> },
      { title: "Người nhận", dataIndex: "toEmail", key: "toEmail", render: (value?: string | null) => value || "-" },
      { title: "Tiêu đề", dataIndex: "subject", key: "subject", render: (value?: string | null) => value || "-" },
      { title: "Đơn hàng", dataIndex: ["order", "orderCode"], key: "order", render: (value?: string | null) => value || "-" },
      { title: "Gửi lúc", dataIndex: "sentAt", key: "sentAt", render: formatDate },
      { title: "Tạo lúc", dataIndex: "createdAt", key: "createdAt", render: formatDate },
      {
        title: labels.actions,
        key: "actions",
        render: (_, record) => (
          <Button type="link" onClick={() => navigate(`/shell/email-logs/${record.id}`)}>
            Chi tiết
          </Button>
        ),
      },
    ],
    [navigate],
  );

  return (
    <>
      <PageHeader title={labels.emailLogs} subtitle="Tra cứu nhật ký email và trạng thái gửi." />
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          const params = new URLSearchParams({ page: "1", perPage: String(perPage) });
          if (values.type?.trim()) params.set("type", values.type.trim());
          if (values.status?.trim()) params.set("status", values.status.trim());
          if (values.q?.trim()) params.set("q", values.q.trim());
          setSearchParams(params);
        }}
      >
        <FilterBar onReset={() => { form.resetFields(); setSearchParams(new URLSearchParams({ page: "1", perPage: String(perPage) })); }}>
          <Form.Item label="Loại email" name="type" style={{ marginBottom: 0, minWidth: 180 }}><Input allowClear /></Form.Item>
          <Form.Item label={labels.status} name="status" style={{ marginBottom: 0, minWidth: 180 }}><Input allowClear /></Form.Item>
          <Form.Item label={labels.search} name="q" style={{ marginBottom: 0, minWidth: 240 }}><Input allowClear /></Form.Item>
        </FilterBar>
      </Form>
      <AsyncState loading={loading} error={error} empty={!rows.length}>
        <ResourceTable<EmailLogRecord>
          columns={columns}
          rows={rows}
          loading={loading}
          page={page}
          perPage={perPage}
          total={total}
          onChangePage={(nextPage, nextPageSize) => {
            const params = new URLSearchParams({ page: String(nextPage), perPage: String(nextPageSize) });
            if (currentType) params.set("type", currentType);
            if (currentStatus) params.set("status", currentStatus);
            if (currentQuery) params.set("q", currentQuery);
            setSearchParams(params);
          }}
          rowSelection={{
            selectedRowKeys: selection.selectedRowKeys,
            onChange: selection.onSelectionChange,
            toolbar: (
              <StandardBulkActions<EmailLogRecord>
                selectedRows={selection.selectedRows}
                onClear={selection.clearSelection}
                onView={(row) => navigate(`/shell/email-logs/${row.id}`)}
              />
            ),
          }}
        />
      </AsyncState>
    </>
  );
}
