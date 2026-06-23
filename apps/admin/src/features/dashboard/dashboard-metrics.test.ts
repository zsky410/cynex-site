import { describe, expect, it } from "vitest";
import { getDashboardHighlights, getDashboardMetrics, type DashboardData } from "./dashboard-metrics";

function createDashboardData(overrides: Partial<DashboardData> = {}): DashboardData {
  return {
    pending: 8,
    processing: 4,
    deliveredToday: 3,
    revenue: 1_500_000,
    revenue7Days: 450_000,
    newUsersToday: 2,
    openWarrantyCases: 1,
    stalePendingOrders: 2,
    stock: {
      accountsAvailable: 6,
      keysAvailable: 3,
      totalAvailable: 9,
      sharedWithSlots: 2,
    },
    ...overrides,
  };
}

describe("dashboard metrics", () => {
  it("derives ratios and totals from the dashboard payload", () => {
    const metrics = getDashboardMetrics(createDashboardData());

    expect(metrics.activeOrders).toBe(12);
    expect(metrics.totalFlow).toBe(15);
    expect(metrics.stalePressure).toBe(25);
    expect(metrics.revenueWindowShare).toBe(30);
    expect(metrics.accountShare).toBeCloseTo(66.67, 2);
    expect(metrics.keyShare).toBeCloseTo(33.33, 2);
    expect(metrics.sharedSlotShare).toBeCloseTo(22.22, 2);
  });

  it("guards against division by zero when source totals are empty", () => {
    const metrics = getDashboardMetrics(
      createDashboardData({
        pending: 0,
        revenue: 0,
        stock: {
          accountsAvailable: 0,
          keysAvailable: 0,
          totalAvailable: 0,
          sharedWithSlots: 0,
        },
      }),
    );

    expect(metrics.stalePressure).toBe(0);
    expect(metrics.revenueWindowShare).toBe(0);
    expect(metrics.accountShare).toBe(0);
    expect(metrics.keyShare).toBe(0);
    expect(metrics.sharedSlotShare).toBe(0);
  });

  it("builds compact highlight cards from the dashboard payload", () => {
    const highlights = getDashboardHighlights(createDashboardData());

    expect(highlights).toEqual([
      { label: "Đơn giao hôm nay", value: "3", tone: "blue" },
      { label: "Người dùng mới", value: "2", tone: "cyan" },
      { label: "Case bảo hành mở", value: "1", tone: "red" },
      { label: "Đơn chờ quá hạn", value: "2", tone: "gold" },
    ]);
  });
});
