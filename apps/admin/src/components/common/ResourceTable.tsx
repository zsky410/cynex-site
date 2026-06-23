import { Table } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import type { ReactNode } from "react";

export function ResourceTable<T extends { id: string | number }>(props: {
  columns: ColumnsType<T>;
  rows: T[];
  loading: boolean;
  page: number;
  perPage: number;
  total: number;
  onChangePage: (page: number, pageSize: number) => void;
  rowSelection?: TablePaginationConfig["position"] extends never
    ? never
    : {
        selectedRowKeys: Array<string | number>;
        onChange: (selectedRowKeys: Array<string | number>, selectedRows: T[]) => void;
        toolbar?: ReactNode;
      };
}) {
  return (
    <div className="admin-resource-table">
      {props.rowSelection?.selectedRowKeys.length ? props.rowSelection.toolbar : null}
      <Table<T>
        rowKey="id"
        columns={props.columns}
        dataSource={props.rows}
        loading={props.loading}
        rowSelection={
          props.rowSelection
            ? {
                selectedRowKeys: props.rowSelection.selectedRowKeys,
                onChange: (selectedRowKeys, selectedRows) =>
                  props.rowSelection?.onChange(
                    selectedRowKeys as Array<string | number>,
                    selectedRows,
                  ),
              }
            : undefined
        }
        pagination={{
          current: props.page,
          pageSize: props.perPage,
          total: props.total,
          showSizeChanger: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} / ${total}`,
          onChange: props.onChangePage,
        }}
        scroll={{ x: true }}
      />
    </div>
  );
}
