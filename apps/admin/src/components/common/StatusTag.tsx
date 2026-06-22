import { Tag } from "antd";

const STATUS_COLOR_MAP: Record<string, string> = {
  active: "success",
  inactive: "default",
  archived: "default",
  draft: "processing",
  paid: "success",
  pending: "warning",
  processing: "processing",
  completed: "success",
  cancelled: "error",
  failed: "error",
  open: "processing",
  closed: "default",
};

type StatusTagProps = {
  status: string | null | undefined;
  label?: string;
};

export function StatusTag({ status, label }: StatusTagProps) {
  const normalizedStatus = (status ?? "unknown").toLowerCase();
  const color = STATUS_COLOR_MAP[normalizedStatus] ?? "default";

  return <Tag color={color}>{label ?? normalizedStatus}</Tag>;
}
