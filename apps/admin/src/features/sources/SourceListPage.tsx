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
import { getDisplayLabel } from "../../lib/display-labels";
import { labels } from "../../lib/labels";

type SourceRecord = {
  id: string;
  name: string;
  contactChannel?: string | null;
  defaultWarrantyDays?: number | null;
  status: string;
  integrityWarnings: IntegrityWarning[];
};

export default function SourceListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<SourceRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = Number(searchParams.get("page") ?? "1");
  const perPage = Number(searchParams.get("perPage") ?? "25");
  const selection = useListSelection<SourceRecord>(searchParams.toString());

  useEffect(() => {
    setLoading(true);
    listResource<SourceRecord>("supply-sources", {
      page,
      perPage,
      sort: "id",
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

  const columns = useMemo<ColumnsType<SourceRecord>>(
    () => [
      { title: "", key: "integrityWarnings", width: 44, render: (_, record) => <IntegrityWarningCell integrityWarnings={record.integrityWarnings} /> },
      { title: "Tên nguồn", dataIndex: "name", key: "name" },
      { title: "Kênh liên hệ", dataIndex: "contactChannel", key: "contactChannel", render: (value?: string | null) => getDisplayLabel(value) },
      { title: "Bảo hành mặc định", dataIndex: "defaultWarrantyDays", key: "defaultWarrantyDays", render: (value?: number | null) => value ?? 0 },
      { title: labels.status, dataIndex: "status", key: "status", render: (value: string) => <StatusTag status={value} /> },
      { title: labels.actions, key: "actions", render: (_, record) => <Button type="link" onClick={() => navigate(`/shell/sources/${record.id}/edit`)}>{labels.edit}</Button> },
    ],
    [navigate],
  );

  const { deleting, deleteSelected } = useBulkDelete({
    resource: "supply-sources",
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
        title={labels.sources}
        subtitle="Quản lý nguồn cung với đầy đủ field liên hệ và chính sách bảo hành."
        extra={<Button type="primary" onClick={() => navigate("/shell/sources/new")}>{labels.create}</Button>}
      />
      <AsyncState loading={loading} error={error} empty={!rows.length}>
        <ResourceTable<SourceRecord>
          columns={columns}
          rows={rows}
          loading={loading}
          page={page}
          perPage={perPage}
          total={total}
          onChangePage={(nextPage, nextPageSize) =>
            setSearchParams(new URLSearchParams({ page: String(nextPage), perPage: String(nextPageSize) }))
          }
          rowSelection={{
            selectedRowKeys: selection.selectedRowKeys,
            onChange: selection.onSelectionChange,
            toolbar: (
              <StandardBulkActions<SourceRecord>
                selectedRows={selection.selectedRows}
                onClear={selection.clearSelection}
                onEdit={(row) => navigate(`/shell/sources/${row.id}/edit`)}
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
