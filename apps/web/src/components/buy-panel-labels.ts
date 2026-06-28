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

const FULFILLMENT_BADGE_LABELS: Record<string, string> = {
  customer_account_upgrade: "Nâng cấp chính chủ",
  dedicated_account: "Tài khoản riêng",
  shared_account: "Tài khoản dùng chung",
  license_key: "Key/License",
  manual_delivery: "Khác",
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

export function getVariantStorefrontOptionLabel(variant: VariantLabelSource): string {
  const secondary = getVariantSecondaryLabel(variant);
  if (!secondary) return getVariantPrimaryLabel(variant);

  const normalizedName = variant.name.toLowerCase();
  const normalizedSecondary = secondary.toLowerCase();
  if (normalizedName.includes(normalizedSecondary)) {
    return getVariantPrimaryLabel(variant);
  }

  return `${getVariantPrimaryLabel(variant)} - ${secondary}`;
}

export function getVariantFulfillmentBadgeLabel(variant: VariantLabelSource): string {
  return FULFILLMENT_BADGE_LABELS[variant.fulfillmentType.toLowerCase()] ?? "Khác";
}

export function getVariantFulfillmentBadgeClassName(selected: boolean): string {
  return selected
    ? "bg-white/10 text-white ring-1 ring-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
    : "bg-sky-50 text-sky-700 ring-1 ring-sky-100";
}
