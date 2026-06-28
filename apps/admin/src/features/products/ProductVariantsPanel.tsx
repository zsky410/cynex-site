import { Button, Popconfirm, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { AsyncState } from "../../components/common/AsyncState";
import { StatusTag } from "../../components/common/StatusTag";
import { deleteResource, listResource } from "../../lib/admin-api";
import { getDisplayLabel } from "../../lib/display-labels";
import { notifyError, notifySuccess } from "../../lib/notifications";

export type ProductVariantRow = {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  fulfillmentType: string;
  status: string;
};

type ProductVariantsPanelProps = {
  productId: string;
  productName: string;
  reloadToken: number;
  onCreateVariant: (product: { id: string; name: string }) => void;
  onEditVariant: (variant: ProductVariantRow, product: { id: string; name: string }) => void;
};

export function ProductVariantsPanel({
  productId,
  productName,
  reloadToken,
  onCreateVariant,
  onEditVariant,
}: ProductVariantsPanelProps) {
  const [rows, setRows] = useState<ProductVariantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    listResource<ProductVariantRow>("product-variants", {
      page: 1,
      perPage: 200,
      sort: "updatedAt",
      order: "DESC",
      filter: { productId },
    })
      .then((response) => setRows(response.data))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [productId, reloadToken]);

  async function removeVariant(variant: ProductVariantRow) {
    setDeletingId(variant.id);
    try {
      await deleteResource("product-variants", variant.id);
      setRows((currentRows) => currentRows.filter((row) => row.id !== variant.id));
      notifySuccess("Đã xóa biến thể");
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Không thể xóa biến thể");
    } finally {
      setDeletingId(null);
    }
  }

  const columns = useMemo<ColumnsType<ProductVariantRow>>(
    () => [
      { title: "Tên biến thể", dataIndex: "name", key: "name" },
      { title: "Slug", dataIndex: "slug", key: "slug" },
      {
        title: "Giá",
        dataIndex: "price",
        key: "price",
        width: 140,
        render: (value: number) => `${new Intl.NumberFormat("vi-VN").format(value)}đ`,
      },
      {
        title: "Hình thức biến thể",
        dataIndex: "fulfillmentType",
        key: "fulfillmentType",
        render: (value: string) => getDisplayLabel(value),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 130,
        render: (value: string) => <StatusTag status={value} />,
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 170,
        render: (_, record) => (
          <div className="flex items-center gap-2">
            <Button type="link" onClick={() => onEditVariant(record, { id: productId, name: productName })}>
              Sửa
            </Button>
            <Popconfirm
              title="Xóa biến thể này?"
              description="Thao tác này không thể hoàn tác."
              okText="Xóa"
              cancelText="Hủy"
              onConfirm={() => removeVariant(record)}
            >
              <Button danger type="link" loading={deletingId === record.id}>
                Xóa
              </Button>
            </Popconfirm>
          </div>
        ),
      },
    ],
    [deletingId, onEditVariant, productId, productName],
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <Typography.Text strong>Biến thể của {productName}</Typography.Text>
          <Typography.Paragraph type="secondary" style={{ margin: "4px 0 0" }}>
            Quản lý biến thể theo đúng ngữ cảnh sản phẩm, không còn bảng biến thể toàn cục.
          </Typography.Paragraph>
        </div>
        <Button type="primary" onClick={() => onCreateVariant({ id: productId, name: productName })}>
          Thêm biến thể
        </Button>
      </div>

      <AsyncState loading={loading} error={error} empty={!rows.length}>
        <Table<ProductVariantRow>
          rowKey="id"
          columns={columns}
          dataSource={rows}
          loading={loading}
          pagination={false}
          scroll={{ x: true }}
        />
      </AsyncState>
    </div>
  );
}
