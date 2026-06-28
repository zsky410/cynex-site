import { Button, Form, Input, Select, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AsyncState } from "../../components/common/AsyncState";
import { StandardBulkActions } from "../../components/common/StandardBulkActions";
import { FilterBar } from "../../components/common/FilterBar";
import { PageHeader } from "../../components/common/PageHeader";
import { useBulkDelete } from "../../components/common/useBulkDelete";
import { useListSelection } from "../../components/common/useListSelection";
import { StatusTag } from "../../components/common/StatusTag";
import { listResource } from "../../lib/admin-api";
import { getDisplayLabel } from "../../lib/display-labels";
import { labels } from "../../lib/labels";
import { ProductModal } from "./ProductModal";
import { ProductVariantsPanel, type ProductVariantRow } from "./ProductVariantsPanel";
import { VariantModal } from "../variants/VariantModal";

type ProductRecord = {
  id: string;
  name: string;
  slug: string;
  status: string;
  updatedAt?: string;
  shortDescription?: string;
};

type ProductFilterForm = {
  q?: string;
  status?: string;
};

const statusOptions = ["active", "inactive"].map((value) => ({
  value,
  label: getDisplayLabel(value),
}));

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm<ProductFilterForm>();
  const [rows, setRows] = useState<ProductRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalProductId, setModalProductId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedRowKeys, setExpandedRowKeys] = useState<Array<string | number>>([]);
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [variantModalId, setVariantModalId] = useState<string | null>(null);
  const [variantProduct, setVariantProduct] = useState<{ id: string; name: string } | null>(null);
  const [variantReloadByProduct, setVariantReloadByProduct] = useState<Record<string, number>>({});
  const [reloadKey, setReloadKey] = useState(0);

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
      sort: "updatedAt",
      order: "DESC",
      filter,
    })
      .then((response) => {
        setRows(response.data);
        setTotal(response.total);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, perPage, currentStatus, currentQuery, reloadKey]);

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
      {
        title: labels.actions,
        key: "actions",
        render: (_, record) => (
          <div className="flex items-center gap-2">
            <Button type="link" onClick={() => {
              setModalProductId(record.id);
              setModalOpen(true);
            }}>
              {labels.edit}
            </Button>
            <Button type="link" onClick={() => {
              setExpandedRowKeys((current) => (current.includes(record.id) ? current : [...current, record.id]));
              setVariantProduct({ id: record.id, name: record.name });
              setVariantModalId(null);
              setVariantModalOpen(true);
            }}>
              Thêm biến thể
            </Button>
          </div>
        ),
      },
    ],
    [],
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

  function bumpVariantReload(productId: string) {
    setVariantReloadByProduct((current) => ({
      ...current,
      [productId]: (current[productId] ?? 0) + 1,
    }));
  }

  function openVariantModalForProduct(product: { id: string; name: string }) {
    setExpandedRowKeys((current) => (current.includes(product.id) ? current : [...current, product.id]));
    setVariantProduct(product);
    setVariantModalId(null);
    setVariantModalOpen(true);
  }

  function openVariantModalForEdit(variant: ProductVariantRow, product: { id: string; name: string }) {
    setExpandedRowKeys((current) => (current.includes(product.id) ? current : [...current, product.id]));
    setVariantProduct(product);
    setVariantModalId(variant.id);
    setVariantModalOpen(true);
  }

  return (
    <>
      <PageHeader
        title={labels.products}
        subtitle="Quản lý sản phẩm làm trung tâm, với biến thể nằm ngay trong từng sản phẩm."
        extra={
          <Button type="primary" onClick={() => {
            setModalProductId(null);
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
        <div className="admin-resource-table">
          {selection.selectedRowKeys.length ? (
            <StandardBulkActions<ProductRecord>
              selectedRows={selection.selectedRows}
              onClear={selection.clearSelection}
              onEdit={(row) => {
                setModalProductId(row.id);
                setModalOpen(true);
              }}
              onDelete={deleteSelected}
              deleting={deleting}
            />
          ) : null}
          <Table<ProductRecord>
            rowKey="id"
            columns={columns}
            dataSource={rows}
            loading={loading}
            rowSelection={{
              selectedRowKeys: selection.selectedRowKeys,
              onChange: (selectedRowKeys, selectedRows) =>
                selection.onSelectionChange(
                  selectedRowKeys as Array<string | number>,
                  selectedRows,
                ),
            }}
            expandable={{
              expandedRowKeys,
              onExpandedRowsChange: (keys) => setExpandedRowKeys(keys as Array<string | number>),
              expandedRowRender: (record) => (
                <ProductVariantsPanel
                  productId={record.id}
                  productName={record.name}
                  reloadToken={variantReloadByProduct[record.id] ?? 0}
                  onCreateVariant={openVariantModalForProduct}
                  onEditVariant={openVariantModalForEdit}
                />
              ),
            }}
            pagination={{
              current: page,
              pageSize: perPage,
              total,
              showSizeChanger: true,
              showTotal: (rowTotal, range) => `${range[0]}-${range[1]} / ${rowTotal}`,
              onChange: (nextPage, nextPageSize) =>
                setSearchParams(
                  new URLSearchParams({
                    page: String(nextPage),
                    perPage: String(nextPageSize),
                    ...(currentStatus ? { status: currentStatus } : {}),
                    ...(currentQuery ? { q: currentQuery } : {}),
                  }),
                ),
            }}
            scroll={{ x: true }}
          />
        </div>
      </AsyncState>
      <ProductModal
        open={modalOpen}
        productId={modalProductId}
        onClose={() => setModalOpen(false)}
        onSaved={(product) => {
          setReloadKey((current) => current + 1);
          if (product.created) {
            openVariantModalForProduct({ id: product.id, name: product.name });
          }
        }}
      />
      <VariantModal
        open={variantModalOpen}
        variantId={variantModalId}
        fixedProduct={variantProduct}
        onClose={() => {
          setVariantModalOpen(false);
          setVariantModalId(null);
          setVariantProduct(null);
        }}
        onSaved={() => {
          setVariantModalOpen(false);
          setVariantModalId(null);
          if (variantProduct) bumpVariantReload(variantProduct.id);
          setVariantProduct(null);
        }}
      />
    </>
  );
}
