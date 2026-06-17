import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { AdminAuthGuard } from "../../auth/guards";
import { PrismaService } from "../../prisma/prisma.service";
import { parseListQuery } from "../common/list-query";

@UseGuards(AdminAuthGuard)
@Controller("admin/orders")
export class AdminOrdersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query() q: Record<string, any>) {
    const { skip, take, orderBy, filter, ids } = parseListQuery(q);
    const where: any = {};
    if (ids) where.id = { in: ids };
    if (filter.paymentStatus) where.paymentStatus = filter.paymentStatus;
    if (filter.fulfillmentStatus) where.fulfillmentStatus = filter.fulfillmentStatus;
    if (filter.userId) where.userId = filter.userId;
    if (filter.q) where.orderCode = { contains: String(filter.q), mode: "insensitive" };
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { user: { select: { email: true } } },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { data, total };
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        payments: true,
        items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { name: true, fulfillmentType: true } },
            fulfillment: true,
          },
        },
      },
    });
    return { data: order };
  }
}
