import { BadRequestException } from "@nestjs/common";

export type CustomerInputField = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
};

type CustomerInputSchema = {
  fields?: Array<Partial<CustomerInputField> | Record<string, unknown>>;
} | null | undefined;

type CustomerInputValue = Record<string, unknown> | null | undefined;

export function getConfiguredCustomerFields(schema: CustomerInputSchema): CustomerInputField[] {
  return (schema?.fields ?? []).filter(
    (field): field is CustomerInputField =>
      typeof field?.name === "string" &&
      typeof field?.label === "string" &&
      Boolean(field.name.trim()) &&
      Boolean(field.label.trim()),
  );
}

export function assertValidCustomerInput(
  schema: CustomerInputSchema,
  customerInput: CustomerInputValue,
) {
  const fields = getConfiguredCustomerFields(schema);
  if (!fields.length) {
    throw new BadRequestException("Gói này chưa cấu hình thông tin khách cần nhập");
  }

  const normalized = customerInput ?? {};
  const missingRequired = fields.find((field) => {
    if (!field.required) return false;
    const value = normalized[field.name];
    return typeof value !== "string" || !value.trim();
  });

  if (missingRequired) {
    throw new BadRequestException(`Vui lòng nhập ${missingRequired.label}`);
  }
}
