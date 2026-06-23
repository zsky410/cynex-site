import { Button, Space, Typography } from "antd";
import type { ReactNode } from "react";

type BulkActionBarProps = {
  selectedCount: number;
  onClear: () => void;
  children?: ReactNode;
};

export function BulkActionBar({ selectedCount, onClear, children }: BulkActionBarProps) {
  return (
    <div className="admin-bulk-action-bar">
      <Space size="middle" wrap>
        <Typography.Text strong>
          Đã chọn {selectedCount} bản ghi
        </Typography.Text>
        {children}
      </Space>
      <Button onClick={onClear}>Bỏ chọn</Button>
    </div>
  );
}
