import { Button, Form, Input, Switch } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AsyncState } from "../../components/common/AsyncState";
import { FilterBar } from "../../components/common/FilterBar";
import { PageHeader } from "../../components/common/PageHeader";
import { ResourceTable } from "../../components/common/ResourceTable";
import { StandardBulkActions } from "../../components/common/StandardBulkActions";
import { useBulkDelete } from "../../components/common/useBulkDelete";
import { useListSelection } from "../../components/common/useListSelection";
import { StatusTag } from "../../components/common/StatusTag";
import { listResource } from "../../lib/admin-api";
import { labels } from "../../lib/labels";

type UserRecord = {
  id: string;
  email: string;
  name?: string | null;
  walletBalance: number;
  isLocked: boolean;
  createdAt: string;
};

type UserFilterForm = {
  q?: string;
  isLocked?: boolean;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(value),
  );
}

export default function UserListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm<UserFilterForm>();
  const [rows, setRows] = useState<UserRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = Number(searchParams.get("page") ?? "1");
  const perPage = Number(searchParams.get("perPage") ?? "25");
  const currentQuery = searchParams.get("q") ?? undefined;
  const currentLocked = searchParams.get("isLocked");
  const selection = useListSelection<UserRecord>(searchParams.toString());

  useEffect(() => {
    form.setFieldsValue({
      q: currentQuery,
      isLocked: currentLocked === "true" ? true : undefined,
    });
  }, [currentLocked, currentQuery, form]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const filter: Record<string, unknown> = {};
    if (currentQuery) filter.q = currentQuery;
    if (currentLocked === "true") filter.isLocked = true;

    listResource<UserRecord>("users", {
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
  }, [currentLocked, currentQuery, page, perPage]);

  const columns = useMemo<ColumnsType<UserRecord>>(
    () => [
      { title: "Email", dataIndex: "email", key: "email" },
      { title: "Tên", dataIndex: "name", key: "name", render: (value?: string | null) => value || "-" },
      {
        title: "Số dư ví",
        dataIndex: "walletBalance",
        key: "walletBalance",
        render: (value: number) => `${new Intl.NumberFormat("vi-VN").format(value)}đ`,
      },
      {
        title: "Đăng nhập",
        dataIndex: "isLocked",
        key: "isLocked",
        render: (value: boolean) => (
          <StatusTag status={value ? "locked" : "active"} label={value ? "Đã khóa" : "Hoạt động"} />
        ),
      },
      {
        title: "Tạo lúc",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (value: string) => formatDate(value),
      },
      {
        title: labels.actions,
        key: "actions",
        render: (_, record) => (
          <>
            <Button type="link" onClick={() => navigate(`/shell/users/${record.id}`)}>
              Chi tiết
            </Button>
            <Button type="link" onClick={() => navigate(`/shell/users/${record.id}/edit`)}>
              {labels.edit}
            </Button>
          </>
        ),
      },
    ],
    [navigate],
  );

  const { deleting, deleteSelected } = useBulkDelete({
    resource: "users",
    selectedRowKeys: selection.selectedRowKeys,
    onDeleted: (deletedIds) => {
      setRows((currentRows) => currentRows.filter((row) => !deletedIds.includes(row.id)));
      setTotal((currentTotal) => Math.max(0, currentTotal - deletedIds.length));
      selection.clearSelection();
    },
  });

  return (
    <>
      <PageHeader
        title={labels.users}
        subtitle="Danh sách người dùng, số dư ví và trạng thái khóa đăng nhập."
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          const params = new URLSearchParams({ page: "1", perPage: String(perPage) });
          if (values.q?.trim()) params.set("q", values.q.trim());
          if (values.isLocked) params.set("isLocked", "true");
          setSearchParams(params);
        }}
      >
        <FilterBar
          onReset={() => {
            form.resetFields();
            setSearchParams(new URLSearchParams({ page: "1", perPage: String(perPage) }));
          }}
        >
          <Form.Item label={labels.search} name="q" style={{ marginBottom: 0, minWidth: 240 }}>
            <Input placeholder="Email hoặc tên người dùng" allowClear />
          </Form.Item>
          <Form.Item label="Chỉ user bị khóa" name="isLocked" valuePropName="checked" style={{ marginBottom: 0 }}>
            <Switch />
          </Form.Item>
        </FilterBar>
      </Form>

      <AsyncState loading={loading} error={error} empty={!rows.length}>
        <ResourceTable<UserRecord>
          columns={columns}
          rows={rows}
          loading={loading}
          page={page}
          perPage={perPage}
          total={total}
          onChangePage={(nextPage, nextPageSize) => {
            const params = new URLSearchParams({
              page: String(nextPage),
              perPage: String(nextPageSize),
            });
            if (currentQuery) params.set("q", currentQuery);
            if (currentLocked === "true") params.set("isLocked", "true");
            setSearchParams(params);
          }}
          rowSelection={{
            selectedRowKeys: selection.selectedRowKeys,
            onChange: selection.onSelectionChange,
            toolbar: (
              <StandardBulkActions<UserRecord>
                selectedRows={selection.selectedRows}
                onClear={selection.clearSelection}
                onView={(row) => navigate(`/shell/users/${row.id}`)}
                onEdit={(row) => navigate(`/shell/users/${row.id}/edit`)}
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
