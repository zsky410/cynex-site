import { Controller, Get, UseGuards } from "@nestjs/common";
import { AdminAuthGuard } from "../../auth/guards";
import { PrismaService } from "../../prisma/prisma.service";

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

    const [
      pending,
      processingRows,
      deliveredToday,
      revenueAgg,
      accountsAvailable,
      keysAvailable,
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
      this.prisma.inventoryAccount.count({ where: { status: "available" } }),
      this.prisma.inventoryKey.count({ where: { status: "available" } }),
    ]);

    return {
      pending,
      processing: processingRows,
      deliveredToday,
      revenue: revenueAgg._sum.totalAmount ?? 0,
      stock: {
        accountsAvailable,
        keysAvailable,
        totalAvailable: accountsAvailable + keysAvailable,
      },
    };
  }
}
