export const WALLET_TXN_TYPE_LABEL: Record<string, string> = {
  deposit: "Nạp tiền vào ví",
  purchase: "Thanh toán đơn hàng",
  refund: "Hoàn tiền",
  admin_adjustment: "Điều chỉnh số dư",
};

export const WALLET_PRESET_AMOUNTS = [50_000, 100_000, 200_000, 500_000] as const;
