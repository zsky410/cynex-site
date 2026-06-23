import { Button, Form, Select } from "antd";
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

type OrderRecord = {
  id: string;
  orderCode: string;
  totalAmount: number;
  paymentStatus: string;
  fulfillmentStatus: string;
  createdAt: string;
  user?: { email?: string };
};

type OrderFilterValues = {
  paymentStatus?: string;
  fulfillmentStatus?: string;
};

const paymentStatusOptions = [
  { value: "pending", label: getDisplayLabel("pending") },
  { value: "paid", label: getDisplayLabel("paid") },
  { value: "failed", label: getDisplayLabel("failed") },
  { value: "cancelled", label: getDisplayLabel("cancelled") },
  { value: "refunded", label: getDisplayLabel("refunded") },
];

const fulfillmentStatusOptions = [
  { value: "waiting_payment", label: getDisplayLabel("waiting_payment") },
  { value: "paid_waiting_admin", label: getDisplayLabel("paid_waiting_admin") },
  { value: "processing", label: getDisplayLabel("processing") },
  { value: "assigned", label: getDisplayLabel("assigned") },
  { value: "delivered", label: getDisplayLabel("delivered") },
  { value: "failed", label: getDisplayLabel("failed") },
  { value: "cancelled", label: getDisplayLabel("cancelled") },
  { value: "refunded", label: getDisplayLabel("refunded") },
];

export default function OrderListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm<OrderFilterValues>();
  const [rows, setRows] = useState<OrderRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = Number(searchParams.get("page") ?? "1");
  const perPage = Number(searchParams.get("perPage") ?? "25");
  const paymentStatus = searchParams.get("paymentStatus") ?? undefined;
  const fulfillmentStatus = searchParams.get("fulfillmentStatus") ?? undefined;
  const selection = useListSelection<OrderRecord>(searchParams.toString());

  useEffect(() => {
    form.setFieldsValue({ paymentStatus, fulfillmentStatus });
  }, [form, paymentStatus, fulfillmentStatus]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const filter: Record<string, unknown> = {};
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (fulfillmentStatus) filter.fulfillmentStatus = fulfillmentStatus;

    listResource<OrderRecord>("orders", {
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
  }, [page, perPage, paymentStatus, fulfillmentStatus]);

  const columns = useMemo<ColumnsType<OrderRecord>>(
    () => [
      { title: "Mã đơn", dataIndex: "orderCode", key: "orderCode" },
      {
        title: "Người dùng",
        key: "user",
        render: (_, record) => record.user?.email ?? "Không rõ",
      },
      {
        title: "Tổng tiền",
        dataIndex: "totalAmount",
        key: "totalAmount",
        render: (value: number) => `${new Intl.NumberFormat("vi-VN").format(value)}đ`,
      },
      {
        title: "Thanh toán",
        dataIndex: "paymentStatus",
        key: "paymentStatus",
        render: (status: string) => <StatusTag status={status} />,
      },
      {
        title: "Giao hàng",
        dataIndex: "fulfillmentStatus",
        key: "fulfillmentStatus",
        render: (status: string) => <StatusTag status={status} />,
      },
      {
        title: "Tạo lúc",
        dataIndex: "createdAt",
        key: "createdAt",
        render: (value: string) =>
          value ? new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "-",
      },
      {
        title: labels.actions,
        key: "actions",
        render: (_, record) => (
          <Button type="link" onClick={() => navigate(`/shell/orders/${record.id}`)}>
            Chi tiết
          </Button>
        ),
      },
    ],
    [navigate],
  );

  return (
    <>
      <PageHeader
        title={labels.orders}
        subtitle="Danh sách đơn hàng dùng nguyên bộ lọc paymentStatus/fulfillmentStatus và request shape hiện có."
      />

      <Form
        form={form}
        layout="vertical"
        onFinish={(values) =>
          setSearchParams(
            new URLSearchParams({
              page: "1",
              perPage: String(perPage),
              ...(values.paymentStatus ? { paymentStatus: values.paymentStatus } : {}),
              ...(values.fulfillmentStatus ? { fulfillmentStatus: values.fulfillmentStatus } : {}),
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
          <Form.Item label="Trạng thái thanh toán" name="paymentStatus" style={{ marginBottom: 0, minWidth: 200 }}>
            <Select allowClear options={paymentStatusOptions} />
          </Form.Item>
          <Form.Item label="Trạng thái giao hàng" name="fulfillmentStatus" style={{ marginBottom: 0, minWidth: 220 }}>
            <Select allowClear options={fulfillmentStatusOptions} />
          </Form.Item>
        </FilterBar>
      </Form>

      <AsyncState loading={loading} error={error} empty={!rows.length}>
        <ResourceTable<OrderRecord>
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
                ...(paymentStatus ? { paymentStatus } : {}),
                ...(fulfillmentStatus ? { fulfillmentStatus } : {}),
              }),
            )
          }
          rowSelection={{
            selectedRowKeys: selection.selectedRowKeys,
            onChange: selection.onSelectionChange,
            toolbar: (
              <StandardBulkActions<OrderRecord>
                selectedRows={selection.selectedRows}
                onClear={selection.clearSelection}
                onView={(row) => navigate(`/shell/orders/${row.id}`)}
              />
            ),
          }}
        />
      </AsyncState>
    </>
  );
}
