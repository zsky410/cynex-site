import { WarningFilled } from "@ant-design/icons";
import { Tooltip } from "antd";
import type { IntegrityWarning } from "./IntegrityWarningAlert";

export function IntegrityWarningCell(props: { integrityWarnings?: IntegrityWarning[] }) {
  if (!props.integrityWarnings?.length) return null;

  return (
    <Tooltip title={props.integrityWarnings.map((warning) => warning.message).join("\n")}>
      <WarningFilled aria-label="Bản ghi cần cập nhật" style={{ color: "#ff4d4f" }} />
    </Tooltip>
  );
}
