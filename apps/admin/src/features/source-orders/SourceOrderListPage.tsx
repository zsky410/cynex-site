import { Button } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AsyncState } from "../../components/common/AsyncState";
import { IntegrityWarningCell } from "../../components/common/IntegrityWarningCell";
import { PageHeader } from "../../components/common/PageHeader";
import { ResourceTable } from "../../components/common/ResourceTable";
import { StandardBulkActions } from "../../components/common/StandardBulkActions";
import { useBulkDelete } from "../../components/common/useBulkDelete";
import { useListSelection } from "../../components/common/useListSelection";
import { StatusTag } from "../../components/common/StatusTag";
import type { IntegrityWarning } from "../../components/common/IntegrityWarningAlert";
import { listResource } from "../../lib/admin-api";
import { labels } from "../../lib/labels";

type SourceOrderRecord = {
  id: string;
  externalRef?: string | null;
  cost?: number | null;
  status: string;
  createdAt: string;
  integrityWarnings: IntegrityWarning[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default function SourceOrderListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<SourceOrderRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = Number(searchParams.get("page") ?? "1");
  const perPage = Number(searchParams.get("perPage") ?? "25");
  const selection = useListSelection<SourceOrderRecord>(searchParams.toString());

  useEffect(() => {
    setLoading(true);
    listResource<SourceOrderRecord>("source-orders", {
      page,
      perPage,
      sort: "createdAt",
      order: "DESC",
      filter: {},
    })
      .then((response) => {
        setRows(response.data);
        setTotal(response.total);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [page, perPage]);

  const columns = useMemo<ColumnsType<SourceOrderRecord>>(
    () => [
      { title: "", key: "integrityWarnings", width: 44, render: (_, record) => <IntegrityWarningCell integrityWarnings={record.integrityWarnings} /> },
      { title: "Mã tham chiếu ngoài", dataIndex: "externalRef", key: "externalRef", render: (value?: string | null) => value || "-" },
      { title: "Chi phí", dataIndex: "cost", key: "cost", render: (value?: number | null) => value == null ? "-" : `${new Intl.NumberFormat("vi-VN").format(value)}đ` },
      { title: labels.status, dataIndex: "status", key: "status", render: (value: string) => <StatusTag status={value} /> },
      { title: "Tạo lúc", dataIndex: "createdAt", key: "createdAt", render: formatDate },
      { title: labels.actions, key: "actions", render: (_, record) => <Button type="link" onClick={() => navigate(`/shell/source-orders/${record.id}/edit`)}>{labels.edit}</Button> },
    ],
    [navigate],
  );

  const { deleting, deleteSelected } = useBulkDelete({
    resource: "source-orders",
    selectedRowKeys: selection.selectedRowKeys,
    onDeleted: (deletedIds) => {
      setRows((currentRows) => currentRows.filter((row) => !deletedIds.includes(row.id)));
      setTotal((currentTotal) => Math.max(0, currentTotal - deletedIds.length));
      selection.clearSelection();
    },
  });

  return (
    <>
      <PageHeader title={labels.sourceOrders} subtitle="Theo dõi đơn nhập từ nhà cung cấp theo contract hiện tại." extra={<Button type="primary" onClick={() => navigate("/shell/source-orders/new")}>{labels.create}</Button>} />
      <AsyncState loading={loading} error={error} empty={!rows.length}>
        <ResourceTable<SourceOrderRecord>
          columns={columns}
          rows={rows}
          loading={loading}
          page={page}
          perPage={perPage}
          total={total}
          onChangePage={(nextPage, nextPageSize) => setSearchParams(new URLSearchParams({ page: String(nextPage), perPage: String(nextPageSize) }))}
          rowSelection={{
            selectedRowKeys: selection.selectedRowKeys,
            onChange: selection.onSelectionChange,
            toolbar: (
              <StandardBulkActions<SourceOrderRecord>
                selectedRows={selection.selectedRows}
                onClear={selection.clearSelection}
                onEdit={(row) => navigate(`/shell/source-orders/${row.id}/edit`)}
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
