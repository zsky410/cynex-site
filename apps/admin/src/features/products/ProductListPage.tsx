import { Button, Form, Input, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AsyncState } from "../../components/common/AsyncState";
import { StandardBulkActions } from "../../components/common/StandardBulkActions";
import { FilterBar } from "../../components/common/FilterBar";
import { PageHeader } from "../../components/common/PageHeader";
import { ResourceTable } from "../../components/common/ResourceTable";
import { useBulkDelete } from "../../components/common/useBulkDelete";
import { useListSelection } from "../../components/common/useListSelection";
import { StatusTag } from "../../components/common/StatusTag";
import { listResource } from "../../lib/admin-api";
import { getDisplayLabel } from "../../lib/display-labels";
import { labels } from "../../lib/labels";

type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  status: string;
  sortOrder: number;
  shortDescription?: string;
};

type ProductFilterForm = {
  q?: string;
  status?: string;
};

const statusOptions = ["draft", "active", "inactive", "archived"].map((value) => ({
  value,
  label: getDisplayLabel(value),
}));

export default function ProductListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm<ProductFilterForm>();
  const [rows, setRows] = useState<ProductRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = Number(searchParams.get("page") ?? "1");
  const perPage = Number(searchParams.get("perPage") ?? "25");
  const currentStatus = searchParams.get("status") ?? undefined;
  const currentQuery = searchParams.get("q") ?? undefined;
  const selection = useListSelection<ProductRecord>(searchParams.toString());

  useEffect(() => {
    form.setFieldsValue({ q: currentQuery, status: currentStatus });
  }, [currentQuery, currentStatus, form]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const filter: Record<string, unknown> = {};
    if (currentStatus) filter.status = currentStatus;
    if (currentQuery) filter.q = currentQuery;

    listResource<ProductRecord>("products", {
      page,
      perPage,
      sort: "sortOrder",
      order: "ASC",
      filter,
    })
      .then((response) => {
        setRows(response.data);
        setTotal(response.total);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, perPage, currentStatus, currentQuery]);

  const columns = useMemo<ColumnsType<ProductRecord>>(
    () => [
      { title: "Tên sản phẩm", dataIndex: "name", key: "name" },
      { title: "Slug", dataIndex: "slug", key: "slug" },
      {
        title: labels.status,
        dataIndex: "status",
        key: "status",
        render: (status: string) => <StatusTag status={status} />,
      },
      { title: "Thứ tự", dataIndex: "sortOrder", key: "sortOrder", width: 120 },
      {
        title: labels.actions,
        key: "actions",
        render: (_, record) => (
          <Button type="link" onClick={() => navigate(`/shell/products/${record.id}/edit`)}>
            {labels.edit}
          </Button>
        ),
      },
    ],
    [navigate],
  );

  const { deleting, deleteSelected } = useBulkDelete({
    resource: "products",
    selectedRowKeys: selection.selectedRowKeys,
    onDeleted: (deletedIds) => {
      setRows((currentRows) => currentRows.filter((row) => !deletedIds.includes(row.id)));
      setTotal((currentTotal) => Math.max(0, currentTotal - deletedIds.length));
      selection.clearSelection();
    },
  });

  function updateParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams);
    Object.entries(next).forEach(([key, value]) => {
      if (!value) params.delete(key);
      else params.set(key, value);
    });
    setSearchParams(params);
  }

  return (
    <>
      <PageHeader
        title={labels.products}
        subtitle="Giữ nguyên contract danh sách sản phẩm hiện tại, với bộ lọc và chỉnh sửa theo shell Ant Design."
        extra={
          <Button type="primary" onClick={() => navigate("/shell/products/new")}>
            {labels.create}
          </Button>
        }
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => {
          updateParams({
            page: "1",
            q: values.q?.trim() || undefined,
            status: values.status || undefined,
          });
        }}
      >
        <FilterBar
          onReset={() => {
            form.resetFields();
            setSearchParams(new URLSearchParams({ page: "1", perPage: String(perPage) }));
          }}
        >
          <Form.Item label={labels.search} name="q" style={{ marginBottom: 0, minWidth: 240 }}>
            <Input placeholder="Tên hoặc slug sản phẩm" allowClear />
          </Form.Item>
          <Form.Item label={labels.status} name="status" style={{ marginBottom: 0, minWidth: 180 }}>
            <Select allowClear options={statusOptions} placeholder="Tất cả trạng thái" />
          </Form.Item>
        </FilterBar>
      </Form>

      <AsyncState loading={loading} error={error} empty={!rows.length}>
        <ResourceTable<ProductRecord>
          columns={columns}
          rows={rows}
          loading={loading}
          page={page}
          perPage={perPage}
          total={total}
          onChangePage={(nextPage, nextPageSize) =>
            setSearchParams(
              new URLSearchParams({
                page: String(nextPage),
                perPage: String(nextPageSize),
                ...(currentStatus ? { status: currentStatus } : {}),
                ...(currentQuery ? { q: currentQuery } : {}),
              }),
            )
          }
          rowSelection={{
            selectedRowKeys: selection.selectedRowKeys,
            onChange: selection.onSelectionChange,
            toolbar: (
              <StandardBulkActions<ProductRecord>
                selectedRows={selection.selectedRows}
                onClear={selection.clearSelection}
                onEdit={(row) => navigate(`/shell/products/${row.id}/edit`)}
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
