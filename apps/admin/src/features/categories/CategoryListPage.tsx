import { Button, Form, Input } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AsyncState } from "../../components/common/AsyncState";
import { FilterBar } from "../../components/common/FilterBar";
import { PageHeader } from "../../components/common/PageHeader";
import { ResourceTable } from "../../components/common/ResourceTable";
import { StandardBulkActions } from "../../components/common/StandardBulkActions";
import { useBulkDelete } from "../../components/common/useBulkDelete";
import { useListSelection } from "../../components/common/useListSelection";
import { listResource } from "../../lib/admin-api";
import { labels } from "../../lib/labels";
import { CategoryModal } from "./CategoryModal";

type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
};

type CategoryFilterForm = {
  q?: string;
};

export default function CategoryListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm<CategoryFilterForm>();
  const [rows, setRows] = useState<CategoryRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalCategoryId, setModalCategoryId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const page = Number(searchParams.get("page") ?? "1");
  const perPage = Number(searchParams.get("perPage") ?? "25");
  const currentQuery = searchParams.get("q") ?? undefined;
  const selection = useListSelection<CategoryRecord>(searchParams.toString());

  useEffect(() => {
    form.setFieldsValue({ q: currentQuery });
  }, [currentQuery, form]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const filter: Record<string, unknown> = {};
    if (currentQuery) filter.q = currentQuery;

    listResource<CategoryRecord>("categories", {
      page,
      perPage,
      sort: "name",
      order: "ASC",
      filter,
    })
      .then((response) => {
        setRows(response.data);
        setTotal(response.total);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [currentQuery, page, perPage, reloadKey]);

  const columns = useMemo<ColumnsType<CategoryRecord>>(
    () => [
      { title: "Tên danh mục", dataIndex: "name", key: "name" },
      { title: "Slug", dataIndex: "slug", key: "slug" },
      {
        title: labels.actions,
        key: "actions",
        render: (_, record) => (
          <Button type="link" onClick={() => {
            setModalCategoryId(record.id);
            setModalOpen(true);
          }}>
            {labels.edit}
          </Button>
        ),
      },
    ],
    [],
  );

  const { deleting, deleteSelected } = useBulkDelete({
    resource: "categories",
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
        title={labels.categories}
        subtitle="Quản lý danh mục dùng chung cho admin và storefront."
        extra={
          <Button type="primary" onClick={() => {
            setModalCategoryId(null);
            setModalOpen(true);
          }}>
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
          });
        }}
      >
        <FilterBar
          onReset={() => {
            form.resetFields();
            setSearchParams(new URLSearchParams({ page: "1", perPage: String(perPage) }));
          }}
        >
          <Form.Item label={labels.search} name="q" style={{ marginBottom: 0, minWidth: 280 }}>
            <Input placeholder="Tên hoặc slug danh mục" allowClear />
          </Form.Item>
        </FilterBar>
      </Form>

      <AsyncState loading={loading} error={error} empty={!rows.length}>
        <ResourceTable<CategoryRecord>
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
                ...(currentQuery ? { q: currentQuery } : {}),
              }),
            )
          }
          rowSelection={{
            selectedRowKeys: selection.selectedRowKeys,
            onChange: selection.onSelectionChange,
            toolbar: (
              <StandardBulkActions<CategoryRecord>
                selectedRows={selection.selectedRows}
                onClear={selection.clearSelection}
                onEdit={(row) => {
                  setModalCategoryId(row.id);
                  setModalOpen(true);
                }}
                onDelete={deleteSelected}
                deleting={deleting}
              />
            ),
          }}
        />
      </AsyncState>

      <CategoryModal
        open={modalOpen}
        categoryId={modalCategoryId}
        onClose={() => setModalOpen(false)}
        onSaved={() => setReloadKey((current) => current + 1)}
      />
    </>
  );
}
