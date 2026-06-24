import { useState } from "react";
import { deleteManyResources } from "../../lib/admin-api";
import { notifyError, notifySuccess } from "../../lib/notifications";

function formatDeleteFailure(error: { message: string; status?: number; body?: unknown }) {
  if (error.status !== 409 || !error.body || typeof error.body !== "object") {
    return error.message;
  }

  const body = error.body as {
    message?: string;
    blockingDependencies?: Array<{ resource: string; count: number }>;
  };

  if (!body.blockingDependencies?.length) {
    return body.message ?? error.message;
  }

  const dependencySummary = body.blockingDependencies
    .map((dependency) => `${dependency.resource} (${dependency.count})`)
    .join(", ");

  return `${body.message ?? error.message} Phụ thuộc: ${dependencySummary}.`;
}

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

      notifyError(
        result.failed[0] ? formatDeleteFailure(result.failed[0]) : "Không thể xóa các bản ghi đã chọn",
      );
    } finally {
      setDeleting(false);
    }
  }

  return { deleting, deleteSelected };
}
