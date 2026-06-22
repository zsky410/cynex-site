import { Controller, Get, UseGuards } from "@nestjs/common";
import { AdminAuthGuard } from "../../auth/guards";
import { PrismaService } from "../../prisma/prisma.service";

const STALE_PENDING_HOURS = 24;

@UseGuards(AdminAuthGuard)
@Controller("admin/dashboard")
export class AdminDashboardController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async get() {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    const weekAgo = new Date(start);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const staleBefore = new Date(Date.now() - STALE_PENDING_HOURS * 60 * 60 * 1000);

    const [
      pending,
      processingRows,
      deliveredToday,
      revenueAgg,
      revenue7DaysAgg,
      newUsersToday,
      openWarrantyCases,
      stalePendingOrders,
      accountsAvailable,
      keysAvailable,
      sharedAccounts,
    ] = await Promise.all([
      this.prisma.order.count({ where: { fulfillmentStatus: "paid_waiting_admin" } }),
      this.prisma.order.count({
        where: { fulfillmentStatus: { in: ["processing", "assigned"] } },
      }),
      this.prisma.order.count({
        where: {
          fulfillmentStatus: "delivered",
          deliveredAt: { gte: start, lt: end },
        },
      }),
      this.prisma.order.aggregate({
        where: { paymentStatus: "paid" },
        _sum: { totalAmount: true },
      }),
      this.prisma.order.aggregate({
        where: { paymentStatus: "paid", paidAt: { gte: weekAgo } },
        _sum: { totalAmount: true },
      }),
      this.prisma.user.count({ where: { createdAt: { gte: start, lt: end } } }),
      this.prisma.warrantyCase.count({
        where: { status: { in: ["open", "waiting_admin", "waiting_customer", "processing"] } },
      }),
      this.prisma.order.count({
        where: {
          fulfillmentStatus: "paid_waiting_admin",
          paidAt: { lt: staleBefore },
        },
      }),
      this.prisma.inventoryAccount.count({ where: { status: "available" } }),
      this.prisma.inventoryKey.count({ where: { status: "available" } }),
      this.prisma.inventoryAccount.findMany({
        where: { accountType: "shared", status: { in: ["available", "assigned"] } },
        select: { usedSlots: true, maxSlots: true },
      }),
    ]);

    const sharedWithSlots = sharedAccounts.filter((a) => a.usedSlots < a.maxSlots).length;

    return {
      pending,
      processing: processingRows,
      deliveredToday,
      revenue: revenueAgg._sum.totalAmount ?? 0,
      revenue7Days: revenue7DaysAgg._sum.totalAmount ?? 0,
      newUsersToday,
      openWarrantyCases,
      stalePendingOrders,
      stock: {
        accountsAvailable,
        keysAvailable,
        totalAvailable: accountsAvailable + keysAvailable,
        sharedWithSlots,
      },
    };
  }
}
