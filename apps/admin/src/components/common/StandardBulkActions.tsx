import { Button, Popconfirm } from "antd";
import type { ReactNode } from "react";
import { BulkActionBar } from "./BulkActionBar";

export function StandardBulkActions<T>(props: {
  selectedRows: T[];
  onClear: () => void;
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: () => Promise<void> | void;
  deleting?: boolean;
  extraActions?: ReactNode;
}) {
  const singleRow = props.selectedRows.length === 1 ? props.selectedRows[0] : null;

  return (
    <BulkActionBar selectedCount={props.selectedRows.length} onClear={props.onClear}>
      {props.onView && singleRow ? (
        <Button onClick={() => props.onView?.(singleRow)}>Chi tiết</Button>
      ) : null}
      {props.onEdit && singleRow ? (
        <Button onClick={() => props.onEdit?.(singleRow)}>Chỉnh sửa</Button>
      ) : null}
      {props.extraActions}
      {props.onDelete ? (
        <Popconfirm
          title="Xóa các bản ghi đã chọn?"
          description="Thao tác này không thể hoàn tác."
          okText="Xóa"
          cancelText="Hủy"
          onConfirm={() => props.onDelete?.()}
        >
          <Button danger loading={props.deleting}>
            Xóa đã chọn
          </Button>
        </Popconfirm>
      ) : null}
    </BulkActionBar>
  );
}
