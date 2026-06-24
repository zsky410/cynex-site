// Domain enums mirrored from the PRD (section 5, 8, 11). These are kept as plain
// const objects + string-literal unions so they can be shared by Prisma, NestJS,
// Next.js and React Admin without pulling in Prisma's generated enums everywhere.

export const FulfillmentType = {
  CUSTOMER_ACCOUNT_UPGRADE: "CUSTOMER_ACCOUNT_UPGRADE",
  DEDICATED_ACCOUNT: "DEDICATED_ACCOUNT",
  SHARED_ACCOUNT: "SHARED_ACCOUNT",
  LICENSE_KEY: "LICENSE_KEY",
  MANUAL_DELIVERY: "MANUAL_DELIVERY",
} as const;
export type FulfillmentType = (typeof FulfillmentType)[keyof typeof FulfillmentType];

export const PaymentStatus = {
  pending: "pending",
  paid: "paid",
  failed: "failed",
  cancelled: "cancelled",
  refunded: "refunded",
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const FulfillmentStatus = {
  waiting_payment: "waiting_payment",
  paid_waiting_admin: "paid_waiting_admin",
  processing: "processing",
  assigned: "assigned",
  delivered: "delivered",
  failed: "failed",
  cancelled: "cancelled",
  refunded: "refunded",
} as const;
export type FulfillmentStatus = (typeof FulfillmentStatus)[keyof typeof FulfillmentStatus];

// Progress ranking for the fulfillment pipeline. An order's overall status is the
// LEAST-advanced of its items, so an order is only "delivered" once every item is.
// Terminal/exception states (failed/cancelled/refunded) are not ranked here.
const FULFILLMENT_PROGRESS: FulfillmentStatus[] = [
  "waiting_payment",
  "paid_waiting_admin",
  "processing",
  "assigned",
  "delivered",
];

export function leastAdvancedFulfillment(
  statuses: FulfillmentStatus[],
): FulfillmentStatus | undefined {
  let min: FulfillmentStatus | undefined;
  let minRank = Infinity;
  for (const s of statuses) {
    const rank = FULFILLMENT_PROGRESS.indexOf(s);
    if (rank === -1) continue; // ignore exception states for order rollup
    if (rank < minRank) {
      minRank = rank;
      min = s;
    }
  }
  return min;
}

export const PaymentProvider = {
  payos: "payos",
  sepay: "sepay",
  wallet: "wallet",
  manual: "manual",
} as const;
export type PaymentProvider = (typeof PaymentProvider)[keyof typeof PaymentProvider];

export const PaymentMethod = {
  payos: "payos",
  sepay: "sepay",
  wallet: "wallet",
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const InventoryAccountStatus = {
  available: "available",
  assigned: "assigned",
  delivered: "delivered",
  full: "full",
  replaced: "replaced",
  disabled: "disabled",
  expired: "expired",
} as const;
export type InventoryAccountStatus =
  (typeof InventoryAccountStatus)[keyof typeof InventoryAccountStatus];

export const InventoryKeyStatus = {
  available: "available",
  assigned: "assigned",
  delivered: "delivered",
  invalid: "invalid",
  replaced: "replaced",
  refunded: "refunded",
} as const;
export type InventoryKeyStatus = (typeof InventoryKeyStatus)[keyof typeof InventoryKeyStatus];

export const AccountType = {
  dedicated: "dedicated",
  shared: "shared",
} as const;
export type AccountType = (typeof AccountType)[keyof typeof AccountType];

export const AllocationStatus = {
  active: "active",
  expired: "expired",
  replaced: "replaced",
  cancelled: "cancelled",
} as const;
export type AllocationStatus = (typeof AllocationStatus)[keyof typeof AllocationStatus];

export const SourceOrderStatus = {
  not_ordered: "not_ordered",
  ordered: "ordered",
  waiting_source: "waiting_source",
  source_delivered: "source_delivered",
  source_failed: "source_failed",
  claimed_warranty: "claimed_warranty",
  cancelled: "cancelled",
} as const;
export type SourceOrderStatus = (typeof SourceOrderStatus)[keyof typeof SourceOrderStatus];

export const WarrantyCaseStatus = {
  open: "open",
  waiting_admin: "waiting_admin",
  waiting_customer: "waiting_customer",
  processing: "processing",
  resolved: "resolved",
  rejected: "rejected",
  closed: "closed",
} as const;
export type WarrantyCaseStatus = (typeof WarrantyCaseStatus)[keyof typeof WarrantyCaseStatus];

export const WarrantyReason = {
  cannot_login: "cannot_login",
  wrong_password: "wrong_password",
  key_invalid: "key_invalid",
  premium_missing: "premium_missing",
  account_limited: "account_limited",
  need_instruction: "need_instruction",
  other: "other",
} as const;
export type WarrantyReason = (typeof WarrantyReason)[keyof typeof WarrantyReason];

export const WalletTransactionType = {
  deposit: "deposit",
  purchase: "purchase",
  refund: "refund",
  admin_adjustment: "admin_adjustment",
} as const;
export type WalletTransactionType =
  (typeof WalletTransactionType)[keyof typeof WalletTransactionType];

export const EmailType = {
  verify_email: "verify_email",
  reset_password: "reset_password",
  payment_confirmed: "payment_confirmed",
  wallet_deposit_confirmed: "wallet_deposit_confirmed",
  delivery: "delivery",
  refund: "refund",
  warranty_update: "warranty_update",
} as const;
export type EmailType = (typeof EmailType)[keyof typeof EmailType];

export const EmailStatus = {
  queued: "queued",
  sent: "sent",
  failed: "failed",
  cancelled: "cancelled",
} as const;
export type EmailStatus = (typeof EmailStatus)[keyof typeof EmailStatus];

export const SupplySourceStatus = {
  active: "active",
  inactive: "inactive",
  blocked: "blocked",
  archived: "archived",
} as const;
export type SupplySourceStatus = (typeof SupplySourceStatus)[keyof typeof SupplySourceStatus];

export const ContactChannel = {
  internal: "internal",
  telegram: "telegram",
  discord: "discord",
  website: "website",
  facebook: "facebook",
  email: "email",
  phone: "phone",
  other: "other",
} as const;
export type ContactChannel = (typeof ContactChannel)[keyof typeof ContactChannel];

export const ProductStatus = {
  draft: "draft",
  active: "active",
  inactive: "inactive",
  archived: "archived",
} as const;
export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export const VariantStatus = {
  active: "active",
  inactive: "inactive",
  out_of_stock: "out_of_stock",
  archived: "archived",
} as const;
export type VariantStatus = (typeof VariantStatus)[keyof typeof VariantStatus];

export const ActorType = {
  user: "user",
  admin: "admin",
  system: "system",
} as const;
export type ActorType = (typeof ActorType)[keyof typeof ActorType];

// Audit actions that MUST be logged (PRD 15.4).
export const AuditAction = {
  ADMIN_LOGIN: "ADMIN_LOGIN",
  ADMIN_VIEW_SECRET: "ADMIN_VIEW_SECRET",
  ADMIN_CREATE_PRODUCT: "ADMIN_CREATE_PRODUCT",
  ADMIN_UPDATE_PRODUCT: "ADMIN_UPDATE_PRODUCT",
  ADMIN_CREATE_VARIANT: "ADMIN_CREATE_VARIANT",
  ADMIN_UPDATE_VARIANT: "ADMIN_UPDATE_VARIANT",
  ADMIN_CREATE_SOURCE: "ADMIN_CREATE_SOURCE",
  ADMIN_UPDATE_SOURCE: "ADMIN_UPDATE_SOURCE",
  ADMIN_CREATE_SOURCE_ORDER: "ADMIN_CREATE_SOURCE_ORDER",
  ADMIN_UPDATE_SOURCE_ORDER: "ADMIN_UPDATE_SOURCE_ORDER",
  ADMIN_CREATE_INVENTORY_ACCOUNT: "ADMIN_CREATE_INVENTORY_ACCOUNT",
  ADMIN_UPDATE_INVENTORY_ACCOUNT: "ADMIN_UPDATE_INVENTORY_ACCOUNT",
  ADMIN_ASSIGN_ACCOUNT: "ADMIN_ASSIGN_ACCOUNT",
  ADMIN_ASSIGN_KEY: "ADMIN_ASSIGN_KEY",
  ADMIN_SEND_DELIVERY_EMAIL: "ADMIN_SEND_DELIVERY_EMAIL",
  ADMIN_REFUND_ORDER: "ADMIN_REFUND_ORDER",
  ADMIN_ADJUST_WALLET: "ADMIN_ADJUST_WALLET",
  ADMIN_UPDATE_WARRANTY_CASE: "ADMIN_UPDATE_WARRANTY_CASE",
  ADMIN_REPLACE_WARRANTY_ITEM: "ADMIN_REPLACE_WARRANTY_ITEM",
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];
