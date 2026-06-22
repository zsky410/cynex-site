import { Empty, Result, Spin } from "antd";
import type { PropsWithChildren, ReactNode } from "react";

type AsyncStateProps = PropsWithChildren<{
  loading: boolean;
  error?: string | null;
  empty?: boolean;
  emptyDescription?: ReactNode;
}>;

export function AsyncState({
  loading,
  error,
  empty,
  emptyDescription,
  children,
}: AsyncStateProps) {
  if (loading) {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: 240 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <Result
        status="error"
        title="Không tải được dữ liệu"
        subTitle={error}
      />
    );
  }

  if (empty) {
    return <Empty description={emptyDescription ?? "Không có dữ liệu"} />;
  }

  return <>{children}</>;
}
