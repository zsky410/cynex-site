export type CustomerInputField = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
};

export function getConfiguredCustomerFields(
  schema?: { fields?: CustomerInputField[] } | null,
): CustomerInputField[] {
  return (schema?.fields ?? []).filter(
    (field): field is CustomerInputField =>
      Boolean(field?.name?.trim()) && Boolean(field?.label?.trim()),
  );
}

export function validateCustomerInput(
  fields: CustomerInputField[],
  input: Record<string, string>,
): string | null {
  if (!fields.length) {
    return "Gói này đang thiếu cấu hình thông tin cần nhập. Vui lòng liên hệ hỗ trợ.";
  }

  const missing = fields.find((field) => field.required && !(input[field.name] ?? "").trim());
  return missing ? `Vui lòng nhập ${missing.label}` : null;
}
