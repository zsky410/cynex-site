import { Button, Form, Input, Select } from "antd";
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
import { getDisplayLabel } from "../../lib/display-labels";
import { labels } from "../../lib/labels";

type VariantRecord = {
  id: string;
  name: string;
  slug: string;
  price: number;
  fulfillmentType: string;
  status: string;
};

type VariantFilterForm = {
  q?: string;
  status?: string;
};

const statusOptions = ["active", "inactive", "out_of_stock", "archived"].map((value) => ({
  value,
  label: getDisplayLabel(value),
}));

export default function VariantListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm<VariantFilterForm>();
  const [rows, setRows] = useState<VariantRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = Number(searchParams.get("page") ?? "1");
  const perPage = Number(searchParams.get("perPage") ?? "25");
  const currentStatus = searchParams.get("status") ?? undefined;
  const currentQuery = searchParams.get("q") ?? undefined;
  const selection = useListSelection<VariantRecord>(searchParams.toString());

  useEffect(() => {
    form.setFieldsValue({ q: currentQuery, status: currentStatus });
  }, [currentQuery, currentStatus, form]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const filter: Record<string, unknown> = {};
    if (currentStatus) filter.status = currentStatus;
    if (currentQuery) filter.q = currentQuery;

    listResource<VariantRecord>("product-variants", {
      page,
      perPage,
      sort: "id",
      order: "DESC",
      filter,
    })
      .then((response) => {
        setRows(response.data);
        setTotal(response.total);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, perPage, currentStatus, currentQuery]);

  const columns = useMemo<ColumnsType<VariantRecord>>(
    () => [
      { title: "Tên biến thể", dataIndex: "name", key: "name" },
      { title: "Slug", dataIndex: "slug", key: "slug" },
      {
        title: "Giá",
        dataIndex: "price",
        key: "price",
        render: (value: number) => `${new Intl.NumberFormat("vi-VN").format(value)}đ`,
      },
      { title: "Kiểu giao hàng", dataIndex: "fulfillmentType", key: "fulfillmentType", render: (value: string) => getDisplayLabel(value) },
      {
        title: labels.status,
        dataIndex: "status",
        key: "status",
        render: (status: string) => <StatusTag status={status} />,
      },
      {
        title: labels.actions,
        key: "actions",
        render: (_, record) => (
          <Button type="link" onClick={() => navigate(`/shell/variants/${record.id}/edit`)}>
            {labels.edit}
          </Button>
        ),
      },
    ],
    [navigate],
  );

  const { deleting, deleteSelected } = useBulkDelete({
    resource: "product-variants",
    selectedRowKeys: selection.selectedRowKeys,
    onDeleted: (deletedIds) => {
      setRows((currentRows) => currentRows.filter((row) => !deletedIds.includes(row.id)));
      setTotal((currentTotal) => Math.max(0, currentTotal - deletedIds.length));
      selection.clearSelection();
    },
  });

  function setPageParams(nextPage: number, nextPageSize: number) {
    setSearchParams(
      new URLSearchParams({
        page: String(nextPage),
        perPage: String(nextPageSize),
        ...(currentStatus ? { status: currentStatus } : {}),
        ...(currentQuery ? { q: currentQuery } : {}),
      }),
    );
  }

  return (
    <>
      <PageHeader
        title={labels.variants}
        subtitle="Biến thể vẫn dùng nguyên contract danh sách và field fulfillment hiện có."
        extra={
          <Button type="primary" onClick={() => navigate("/shell/variants/new")}>
            {labels.create}
          </Button>
        }
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={(values) =>
          setSearchParams(
            new URLSearchParams({
              page: "1",
              perPage: String(perPage),
              ...(values.q?.trim() ? { q: values.q.trim() } : {}),
              ...(values.status ? { status: values.status } : {}),
            }),
          )
        }
      >
        <FilterBar
          onReset={() => {
            form.resetFields();
            setSearchParams(new URLSearchParams({ page: "1", perPage: String(perPage) }));
          }}
        >
          <Form.Item label={labels.search} name="q" style={{ marginBottom: 0, minWidth: 240 }}>
            <Input placeholder="Tên hoặc slug biến thể" allowClear />
          </Form.Item>
          <Form.Item label={labels.status} name="status" style={{ marginBottom: 0, minWidth: 180 }}>
            <Select allowClear options={statusOptions} placeholder="Tất cả trạng thái" />
          </Form.Item>
        </FilterBar>
      </Form>

      <AsyncState loading={loading} error={error} empty={!rows.length}>
        <ResourceTable<VariantRecord>
          columns={columns}
          rows={rows}
          loading={loading}
          page={page}
          perPage={perPage}
          total={total}
          onChangePage={setPageParams}
          rowSelection={{
            selectedRowKeys: selection.selectedRowKeys,
            onChange: selection.onSelectionChange,
            toolbar: (
              <StandardBulkActions<VariantRecord>
                selectedRows={selection.selectedRows}
                onClear={selection.clearSelection}
                onEdit={(row) => navigate(`/shell/variants/${row.id}/edit`)}
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
