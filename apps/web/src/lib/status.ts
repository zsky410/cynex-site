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
