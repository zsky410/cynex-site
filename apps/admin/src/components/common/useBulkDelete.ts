import { useState } from "react";
import { deleteManyResources } from "../../lib/admin-api";
import { notifyError, notifySuccess } from "../../lib/notifications";

const resourceLabelMap: Record<string, string> = {
  products: "sản phẩm",
  product_variants: "biến thể sản phẩm",
  order_items: "mục đơn hàng",
  orders: "đơn hàng",
  payments: "thanh toán",
  email_logs: "log email",
  warranty_cases: "ca bảo hành",
  inventory_accounts: "tài khoản kho",
  inventory_keys: "key kho",
  source_orders: "đơn nhập nguồn",
  order_fulfillments: "bản ghi giao hàng",
  account_allocations: "phân bổ tài khoản",
  sold_order_items: "key đã gắn với đơn hàng",
  audit_logs: "log audit",
};

function formatDeleteFailure(error: { message: string; status?: number; body?: unknown }) {
  if (error.status !== 409 || !error.body || typeof error.body !== "object") {
    return error.message;
  }

  const body = error.body as {
    message?: string;
    blockingDependencies?: Array<{ resource: string; count: number; sampleIds?: string[] }>;
  };

  if (!body.blockingDependencies?.length) {
    return body.message ?? error.message;
  }

  const dependencySummary = body.blockingDependencies
    .map((dependency) => {
      const label = resourceLabelMap[dependency.resource] ?? dependency.resource;
      const samples = dependency.sampleIds?.length
        ? `, ví dụ: ${dependency.sampleIds.slice(0, 3).join(", ")}`
        : "";
      return `${label} (${dependency.count}${samples})`;
    })
    .join(", ");

  return `${body.message ?? error.message} Đang liên kết với: ${dependencySummary}.`;
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
