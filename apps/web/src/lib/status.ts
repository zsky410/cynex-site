export const FULFILLMENT_STATUS_LABEL: Record<string, string> = {
  waiting_payment: "Chờ thanh toán",
  paid_waiting_admin: "Đã thanh toán - chờ xử lý",
  processing: "Đang xử lý",
  assigned: "Đã sẵn sàng",
  delivered: "Đã giao hàng",
  failed: "Thất bại",
  cancelled: "Đã hủy",
  refunded: "Đã hoàn tiền",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  pending: "Chưa thanh toán",
  paid: "Đã thanh toán",
  failed: "Thất bại",
  cancelled: "Đã hủy",
  refunded: "Đã hoàn tiền",
};

/** Warranty reason codes — mirrored from @cynex/shared enums (avoid importing shared in client bundles). */
export const WARRANTY_REASONS = [
  "cannot_login",
  "wrong_password",
  "key_invalid",
  "premium_missing",
  "account_limited",
  "need_instruction",
  "other",
] as const;
export type WarrantyReason = (typeof WARRANTY_REASONS)[number];

export const WARRANTY_REASON_LABEL: Record<WarrantyReason, string> = {
  cannot_login: "Không đăng nhập được",
  wrong_password: "Sai mật khẩu",
  key_invalid: "Key không hợp lệ",
  premium_missing: "Không có premium",
  account_limited: "Tài khoản bị giới hạn",
  need_instruction: "Cần hướng dẫn",
  other: "Khác",
};

/** Tailwind badge classes keyed by fulfillmentStatus */
export const FULFILLMENT_STATUS_BADGE: Record<string, string> = {
  waiting_payment: "bg-slate-100 text-slate-600",
  paid_waiting_admin: "bg-amber-50 text-amber-700",
  processing: "bg-violet-50 text-violet-700",
  assigned: "bg-sky-50 text-sky-700",
  delivered: "bg-emerald-50 text-emerald-700",
  failed: "bg-red-50 text-red-700",
  cancelled: "bg-slate-100 text-slate-500",
  refunded: "bg-orange-50 text-orange-700",
};

export const ORDER_FILTER_TABS = [
  { key: "all", label: "Tất cả" },
  { key: "waiting_payment", label: "Chờ thanh toán" },
  { key: "paid_waiting_admin", label: "Chờ xử lý" },
  { key: "processing", label: "Đang xử lý" },
  { key: "delivered", label: "Đã giao" },
  { key: "refunded", label: "Hoàn tiền" },
] as const;
