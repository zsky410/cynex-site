export type DashboardData = {
  pending: number;
  processing: number;
  deliveredToday: number;
  revenue: number;
  revenue7Days: number;
  newUsersToday: number;
  openWarrantyCases: number;
  stalePendingOrders: number;
  stock: {
    accountsAvailable: number;
    keysAvailable: number;
    totalAvailable: number;
    sharedWithSlots: number;
  };
};

export type DashboardHighlight = {
  label: string;
  value: string;
  tone: "blue" | "cyan" | "red" | "gold";
};

function toPercent(value: number) {
  return Math.max(0, Math.min(100, Number.isFinite(value) ? Number(value.toFixed(2)) : 0));
}

export function getDashboardMetrics(data: DashboardData) {
  const activeOrders = data.pending + data.processing;
  const totalFlow = activeOrders + data.deliveredToday;
  const stalePressure = data.pending > 0 ? (data.stalePendingOrders / data.pending) * 100 : 0;
  const revenueWindowShare = data.revenue > 0 ? (data.revenue7Days / data.revenue) * 100 : 0;
  const accountShare =
    data.stock.totalAvailable > 0
      ? (data.stock.accountsAvailable / data.stock.totalAvailable) * 100
      : 0;
  const keyShare =
    data.stock.totalAvailable > 0
      ? (data.stock.keysAvailable / data.stock.totalAvailable) * 100
      : 0;
  const sharedSlotShare =
    data.stock.totalAvailable > 0
      ? (data.stock.sharedWithSlots / data.stock.totalAvailable) * 100
      : 0;

  return {
    activeOrders,
    totalFlow,
    stalePressure: toPercent(stalePressure),
    revenueWindowShare: toPercent(revenueWindowShare),
    accountShare: toPercent(accountShare),
    keyShare: toPercent(keyShare),
    sharedSlotShare: toPercent(sharedSlotShare),
  };
}

export function getDashboardHighlights(data: DashboardData): DashboardHighlight[] {
  return [
    { label: "Đơn giao hôm nay", value: String(data.deliveredToday), tone: "blue" },
    { label: "Người dùng mới", value: String(data.newUsersToday), tone: "cyan" },
    { label: "Case bảo hành mở", value: String(data.openWarrantyCases), tone: "red" },
    { label: "Đơn chờ quá hạn", value: String(data.stalePendingOrders), tone: "gold" },
  ];
}
