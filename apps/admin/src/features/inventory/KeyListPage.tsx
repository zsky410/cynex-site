import { Button, Space } from "antd";
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
import { adminFetch, listResource } from "../../lib/admin-api";
import { getDisplayLabel } from "../../lib/display-labels";
import { labels } from "../../lib/labels";
import { notifyError } from "../../lib/notifications";

type KeyRecord = {
  id: string;
  publicNote?: string | null;
  hasKey: boolean;
  status: string;
  createdAt: string;
  integrityWarnings: IntegrityWarning[];
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default function KeyListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<KeyRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [revealingId, setRevealingId] = useState<string | null>(null);

  const page = Number(searchParams.get("page") ?? "1");
  const perPage = Number(searchParams.get("perPage") ?? "25");
  const selection = useListSelection<KeyRecord>(searchParams.toString());

  useEffect(() => {
    setLoading(true);
    listResource<KeyRecord>("inventory-keys", {
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

  async function reveal(record: KeyRecord) {
    setRevealingId(record.id);
    try {
      const data = await adminFetch<{ data: { key: string } }>(`/admin/inventory-keys/${record.id}/reveal`, {
        method: "POST",
      });
      setRevealed((current) => ({ ...current, [record.id]: data.data.key }));
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Không thể reveal key");
    } finally {
      setRevealingId(null);
    }
  }

  const columns = useMemo<ColumnsType<KeyRecord>>(
    () => [
      { title: "", key: "integrityWarnings", width: 44, render: (_, record) => <IntegrityWarningCell integrityWarnings={record.integrityWarnings} /> },
      { title: "Ghi chú công khai", dataIndex: "publicNote", key: "publicNote", render: (value?: string | null) => value || "-" },
      { title: "Có key", dataIndex: "hasKey", key: "hasKey", render: (value: boolean) => value ? "Có" : "Không" },
      { title: labels.status, dataIndex: "status", key: "status", render: (value: string) => <StatusTag status={value} /> },
      { title: "Tạo lúc", dataIndex: "createdAt", key: "createdAt", render: formatDate },
      {
        title: "Xem bí mật",
        key: "reveal",
        render: (_, record) => (
          <Space direction="vertical" size={4}>
            <Button size="small" onClick={() => reveal(record)} loading={revealingId === record.id}>
              Xem
            </Button>
            {revealed[record.id] ? <pre style={{ margin: 0, whiteSpace: "pre-wrap", maxWidth: 320 }}>{revealed[record.id]}</pre> : null}
          </Space>
        ),
      },
      { title: labels.actions, key: "actions", render: (_, record) => <Button type="link" onClick={() => navigate(`/shell/inventory/keys/${record.id}/edit`)}>{labels.edit}</Button> },
    ],
    [navigate, revealed, revealingId],
  );

  const { deleting, deleteSelected } = useBulkDelete({
    resource: "inventory-keys",
    selectedRowKeys: selection.selectedRowKeys,
    onDeleted: (deletedIds) => {
      setRows((currentRows) => currentRows.filter((row) => !deletedIds.includes(row.id)));
      setTotal((currentTotal) => Math.max(0, currentTotal - deletedIds.length));
      selection.clearSelection();
    },
  });

  return (
    <>
      <PageHeader title={labels.inventoryKeys} subtitle="Kho key với reveal bảo mật và form chỉnh sửa hiện tại." extra={<Button type="primary" onClick={() => navigate("/shell/inventory/keys/new")}>{labels.create}</Button>} />
      <AsyncState loading={loading} error={error} empty={!rows.length}>
        <ResourceTable<KeyRecord>
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
              <StandardBulkActions<KeyRecord>
                selectedRows={selection.selectedRows}
                onClear={selection.clearSelection}
                onEdit={(row) => navigate(`/shell/inventory/keys/${row.id}/edit`)}
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
