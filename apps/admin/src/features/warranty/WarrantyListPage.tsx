import { Button, Form, Input, Select } from "antd";
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
import { getDisplayLabel } from "../../lib/display-labels";
import { labels } from "../../lib/labels";

type WarrantyRecord = {
  id: string;
  status: string;
  reason: string;
  createdAt: string;
  user?: { email?: string };
  order?: { orderCode?: string };
  _count?: { messages?: number };
};

type WarrantyFilterForm = {
  status?: string;
  reason?: string;
  q?: string;
};

const statusOptions = ["open", "waiting_admin", "waiting_customer", "processing", "resolved", "rejected", "closed"].map((value) => ({ value, label: getDisplayLabel(value) }));
const reasonOptions = ["cannot_login", "wrong_password", "key_invalid", "premium_missing", "account_limited", "need_instruction", "other"].map((value) => ({ value, label: getDisplayLabel(value) }));

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default function WarrantyListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm<WarrantyFilterForm>();
  const [rows, setRows] = useState<WarrantyRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = Number(searchParams.get("page") ?? "1");
  const perPage = Number(searchParams.get("perPage") ?? "25");
  const currentStatus = searchParams.get("status") ?? undefined;
  const currentReason = searchParams.get("reason") ?? undefined;
  const currentQuery = searchParams.get("q") ?? undefined;
  const selection = useListSelection<WarrantyRecord>(searchParams.toString());

  useEffect(() => {
    form.setFieldsValue({ status: currentStatus, reason: currentReason, q: currentQuery });
  }, [currentQuery, currentReason, currentStatus, form]);

  useEffect(() => {
    setLoading(true);
    const filter: Record<string, unknown> = {};
    if (currentStatus) filter.status = currentStatus;
    if (currentReason) filter.reason = currentReason;
    if (currentQuery) filter.q = currentQuery;
    listResource<WarrantyRecord>("warranty-cases", {
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
  }, [currentQuery, currentReason, currentStatus, page, perPage]);

  const columns = useMemo<ColumnsType<WarrantyRecord>>(
    () => [
      { title: "ID", dataIndex: "id", key: "id" },
      { title: "Người dùng", dataIndex: ["user", "email"], key: "user" },
      { title: "Đơn hàng", dataIndex: ["order", "orderCode"], key: "order" },
      { title: "Lý do", dataIndex: "reason", key: "reason", render: (value: string) => getDisplayLabel(value) },
      { title: labels.status, dataIndex: "status", key: "status", render: (value: string) => <StatusTag status={value} /> },
      { title: "Số tin nhắn", dataIndex: ["_count", "messages"], key: "messages", render: (value?: number) => value ?? 0 },
      { title: "Tạo lúc", dataIndex: "createdAt", key: "createdAt", render: formatDate },
      {
        title: labels.actions,
        key: "actions",
        render: (_, record) => (
          <>
            <Button type="link" onClick={() => navigate(`/shell/warranty/${record.id}`)}>Chi tiết</Button>
            <Button type="link" onClick={() => navigate(`/shell/warranty/${record.id}/edit`)}>{labels.edit}</Button>
          </>
        ),
      },
    ],
    [navigate],
  );

  return (
    <>
      <PageHeader title={labels.warranty} subtitle="Danh sách case bảo hành với trạng thái, lý do và số lượng tin nhắn." />
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          const params = new URLSearchParams({ page: "1", perPage: String(perPage) });
          if (values.status) params.set("status", values.status);
          if (values.reason) params.set("reason", values.reason);
          if (values.q?.trim()) params.set("q", values.q.trim());
          setSearchParams(params);
        }}
      >
        <FilterBar onReset={() => { form.resetFields(); setSearchParams(new URLSearchParams({ page: "1", perPage: String(perPage) })); }}>
          <Form.Item label={labels.status} name="status" style={{ marginBottom: 0, minWidth: 180 }}><Select allowClear options={statusOptions} /></Form.Item>
          <Form.Item label="Lý do" name="reason" style={{ marginBottom: 0, minWidth: 180 }}><Select allowClear options={reasonOptions} /></Form.Item>
          <Form.Item label={labels.search} name="q" style={{ marginBottom: 0, minWidth: 240 }}><Input allowClear /></Form.Item>
        </FilterBar>
      </Form>
      <AsyncState loading={loading} error={error} empty={!rows.length}>
        <ResourceTable<WarrantyRecord>
          columns={columns}
          rows={rows}
          loading={loading}
          page={page}
          perPage={perPage}
          total={total}
          onChangePage={(nextPage, nextPageSize) => {
            const params = new URLSearchParams({ page: String(nextPage), perPage: String(nextPageSize) });
            if (currentStatus) params.set("status", currentStatus);
            if (currentReason) params.set("reason", currentReason);
            if (currentQuery) params.set("q", currentQuery);
            setSearchParams(params);
          }}
          rowSelection={{
            selectedRowKeys: selection.selectedRowKeys,
            onChange: selection.onSelectionChange,
            toolbar: (
              <StandardBulkActions<WarrantyRecord>
                selectedRows={selection.selectedRows}
                onClear={selection.clearSelection}
                onView={(row) => navigate(`/shell/warranty/${row.id}`)}
                onEdit={(row) => navigate(`/shell/warranty/${row.id}/edit`)}
              />
            ),
          }}
        />
      </AsyncState>
    </>
  );
}
