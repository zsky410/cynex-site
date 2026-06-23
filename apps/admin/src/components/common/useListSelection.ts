import { useEffect, useState } from "react";

export function useListSelection<T extends { id: string | number }>(resetKey: string) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<Array<string | number>>([]);
  const [selectedRows, setSelectedRows] = useState<T[]>([]);

  useEffect(() => {
    setSelectedRowKeys([]);
    setSelectedRows([]);
  }, [resetKey]);

  return {
    selectedRowKeys,
    selectedRows,
    clearSelection: () => {
      setSelectedRowKeys([]);
      setSelectedRows([]);
    },
    onSelectionChange: (
      nextSelectedRowKeys: Array<string | number>,
      nextSelectedRows: T[],
    ) => {
      setSelectedRowKeys(nextSelectedRowKeys);
      setSelectedRows(nextSelectedRows);
    },
  };
}
