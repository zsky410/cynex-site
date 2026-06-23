import { Button, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AsyncState } from "../../components/common/AsyncState";
import { PageHeader } from "../../components/common/PageHeader";
import { ResourceTable } from "../../components/common/ResourceTable";
import { StandardBulkActions } from "../../components/common/StandardBulkActions";
import { useBulkDelete } from "../../components/common/useBulkDelete";
import { useListSelection } from "../../components/common/useListSelection";
import { StatusTag } from "../../components/common/StatusTag";
import { adminFetch, listResource } from "../../lib/admin-api";
import { getDisplayLabel } from "../../lib/display-labels";
import { labels } from "../../lib/labels";
import { notifyError } from "../../lib/notifications";

type AccountRecord = {
  id: string;
  username: string;
  accountType: string;
  usedSlots: number;
  maxSlots: number;
  hasPassword: boolean;
  status: string;
};

export default function AccountListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<AccountRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [revealingId, setRevealingId] = useState<string | null>(null);

  const page = Number(searchParams.get("page") ?? "1");
  const perPage = Number(searchParams.get("perPage") ?? "25");
  const selection = useListSelection<AccountRecord>(searchParams.toString());

  useEffect(() => {
    setLoading(true);
    listResource<AccountRecord>("inventory-accounts", {
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

  async function reveal(record: AccountRecord) {
    setRevealingId(record.id);
    try {
      const data = await adminFetch<{ data: { password: string; recoveryInfo?: string; privateNote?: string } }>(
        `/admin/inventory-accounts/${record.id}/reveal`,
        { method: "POST" },
      );
      setRevealed((current) => ({
        ...current,
        [record.id]: [
          `Mật khẩu: ${data.data.password}`,
          data.data.recoveryInfo ? `Thông tin khôi phục: ${data.data.recoveryInfo}` : null,
          data.data.privateNote ? `Ghi chú riêng: ${data.data.privateNote}` : null,
        ].filter(Boolean).join("\n"),
      }));
    } catch (err) {
      notifyError(err instanceof Error ? err.message : "Không thể reveal tài khoản");
    } finally {
      setRevealingId(null);
    }
  }

  const columns = useMemo<ColumnsType<AccountRecord>>(
    () => [
      { title: "Tên đăng nhập", dataIndex: "username", key: "username" },
      { title: "Loại tài khoản", dataIndex: "accountType", key: "accountType", render: (value: string) => getDisplayLabel(value) },
      { title: "Slot đã dùng", dataIndex: "usedSlots", key: "usedSlots" },
      { title: "Slot tối đa", dataIndex: "maxSlots", key: "maxSlots" },
      { title: "Có mật khẩu", dataIndex: "hasPassword", key: "hasPassword", render: (value: boolean) => value ? "Có" : "Không" },
      { title: labels.status, dataIndex: "status", key: "status", render: (value: string) => <StatusTag status={value} /> },
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
      { title: labels.actions, key: "actions", render: (_, record) => <Button type="link" onClick={() => navigate(`/shell/inventory/accounts/${record.id}/edit`)}>{labels.edit}</Button> },
    ],
    [navigate, revealed, revealingId],
  );

  const { deleting, deleteSelected } = useBulkDelete({
    resource: "inventory-accounts",
    selectedRowKeys: selection.selectedRowKeys,
    onDeleted: (deletedIds) => {
      setRows((currentRows) => currentRows.filter((row) => !deletedIds.includes(row.id)));
      setTotal((currentTotal) => Math.max(0, currentTotal - deletedIds.length));
      selection.clearSelection();
    },
  });

  return (
    <>
      <PageHeader title={labels.inventoryAccounts} subtitle="Kho tài khoản với reveal bảo mật và form chỉnh sửa hiện tại." extra={<Button type="primary" onClick={() => navigate("/shell/inventory/accounts/new")}>{labels.create}</Button>} />
      <AsyncState loading={loading} error={error} empty={!rows.length}>
        <ResourceTable<AccountRecord>
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
              <StandardBulkActions<AccountRecord>
                selectedRows={selection.selectedRows}
                onClear={selection.clearSelection}
                onEdit={(row) => navigate(`/shell/inventory/accounts/${row.id}/edit`)}
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
