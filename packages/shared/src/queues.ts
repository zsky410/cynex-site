// Single source of truth for BullMQ queue + job names shared by api (producer) and
// worker (consumer). Keeping them here prevents typo-mismatches between processes.

export const QUEUE = {
  email: "email",
  alerts: "alerts",
} as const;
export type QueueName = (typeof QUEUE)[keyof typeof QUEUE];

export const EMAIL_JOB = {
  paymentConfirmed: "send-payment-confirmed-email",
  walletDeposit: "send-wallet-deposit-email",
  delivery: "send-delivery-email",
  refund: "send-refund-email",
  resetPassword: "send-reset-password-email",
} as const;
export type EmailJobName = (typeof EMAIL_JOB)[keyof typeof EMAIL_JOB];

export const ALERT_JOB = {
  notifyAdminPending: "notify-admin-pending-order",
  dailyStockAlert: "daily-stock-alert",
} as const;
export type AlertJobName = (typeof ALERT_JOB)[keyof typeof ALERT_JOB];
