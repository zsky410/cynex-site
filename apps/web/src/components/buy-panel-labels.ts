type VariantLabelSource = {
  id: string;
  name: string;
  price: number;
  durationDays?: number | null;
  fulfillmentType: string;
  warrantyDays: number;
  requiresCustomerInput: boolean;
  status: string;
};

export function getVariantPrimaryLabel(variant: VariantLabelSource): string {
  return variant.name;
}

export function getVariantSecondaryLabel(variant: VariantLabelSource): string | null {
  if (variant.durationDays) {
    if (variant.durationDays >= 360) return `${Math.round(variant.durationDays / 30)} Tháng`;
    if (variant.durationDays >= 30) return `${Math.round(variant.durationDays / 30)} Tháng`;
    return `${variant.durationDays} Ngày`;
  }

  const match = variant.name.match(/(\d+)\s*(tháng|năm|ngày)/i);
  if (match) {
    return `${match[1]} ${match[2][0].toUpperCase()}${match[2].slice(1).toLowerCase()}`;
  }

  if (variant.name.toLowerCase().includes("vĩnh viễn")) return "Vĩnh viễn";
  return null;
}
