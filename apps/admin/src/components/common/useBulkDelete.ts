import { useState } from "react";
import { deleteManyResources } from "../../lib/admin-api";
import { notifyError, notifySuccess } from "../../lib/notifications";

export function useBulkDelete(params: {
  resource: string;
  selectedRowKeys: Array<string | number>;
  onDeleted: (deletedIds: Array<string | number>) => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function deleteSelected() {
    if (!params.selectedRowKeys.length) return;

    setDeleting(true);
    try {
      const result = await deleteManyResources(params.resource, params.selectedRowKeys);

      if (result.succeededIds.length) {
        params.onDeleted(result.succeededIds);
      }

      if (!result.failed.length) {
        notifySuccess(`Đã xóa ${result.succeededIds.length} bản ghi`);
        return;
      }

      if (result.succeededIds.length) {
        notifyError(
          `Đã xóa ${result.succeededIds.length} bản ghi, ${result.failed.length} bản ghi lỗi`,
        );
        return;
      }

      notifyError(result.failed[0]?.message ?? "Không thể xóa các bản ghi đã chọn");
    } finally {
      setDeleting(false);
    }
  }

  return { deleting, deleteSelected };
}
