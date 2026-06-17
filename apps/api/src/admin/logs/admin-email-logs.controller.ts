import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { AdminAuthGuard } from "../../auth/guards";
import { PrismaService } from "../../prisma/prisma.service";
import { parseListQuery } from "../common/list-query";

@UseGuards(AdminAuthGuard)
@Controller("admin/email-logs")
export class AdminEmailLogsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query() q: Record<string, any>) {
    const { skip, take, orderBy, filter, ids } = parseListQuery(q);
    const where: any = {};
    if (ids) where.id = { in: ids };
    if (filter.type) where.type = filter.type;
    if (filter.status) where.status = filter.status;
    if (filter.userId) where.userId = filter.userId;
    if (filter.orderId) where.orderId = filter.orderId;
    if (filter.q) {
      const query = String(filter.q);
      where.OR = [
        { toEmail: { contains: query, mode: "insensitive" } },
        { subject: { contains: query, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.emailLog.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          user: { select: { id: true, email: true, name: true } },
          order: { select: { id: true, orderCode: true } },
        },
      }),
      this.prisma.emailLog.count({ where }),
    ]);
    return { data, total };
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    return {
      data: await this.prisma.emailLog.findUniqueOrThrow({
        where: { id },
        include: {
          user: { select: { id: true, email: true, name: true } },
          order: { select: { id: true, orderCode: true } },
        },
      }),
    };
  }
}
