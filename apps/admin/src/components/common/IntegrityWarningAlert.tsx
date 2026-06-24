import { Alert } from "antd";

export type IntegrityWarning = {
  code: string;
  message: string;
  field?: string;
  relatedResource?: string;
  relatedId?: string;
};

export function IntegrityWarningAlert(props: { integrityWarnings?: IntegrityWarning[] }) {
  if (!props.integrityWarnings?.length) return null;

  return (
    <Alert
      type="error"
      showIcon
      message="Bản ghi này cần được cập nhật"
      description={
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {props.integrityWarnings.map((warning) => (
            <li key={`${warning.code}:${warning.field ?? "general"}:${warning.relatedId ?? "none"}`}>
              {warning.message}
            </li>
          ))}
        </ul>
      }
      style={{ marginBottom: 16 }}
    />
  );
}
