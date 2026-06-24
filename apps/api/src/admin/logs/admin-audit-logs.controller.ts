import { Controller, Delete, Get, Param, Query, UseGuards } from "@nestjs/common";
import { AdminAuthGuard } from "../../auth/guards";
import { PrismaService } from "../../prisma/prisma.service";
import { parseListQuery } from "../common/list-query";

@UseGuards(AdminAuthGuard)
@Controller("admin/audit-logs")
export class AdminAuditLogsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query() q: Record<string, any>) {
    const { skip, take, orderBy, filter, ids } = parseListQuery(q);
    const where: any = {};
    if (ids) where.id = { in: ids };
    if (filter.action) where.action = filter.action;
    if (filter.actorType) where.actorType = filter.actorType;
    if (filter.actorId) where.actorId = filter.actorId;
    if (filter.targetType) where.targetType = filter.targetType;
    if (filter.targetId) where.targetId = filter.targetId;
    if (filter.q) {
      const query = String(filter.q);
      where.OR = [
        { action: { contains: query, mode: "insensitive" } },
        { targetType: { contains: query, mode: "insensitive" } },
        { targetId: { contains: query, mode: "insensitive" } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy,
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    return { data, total };
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    return { data: await this.prisma.auditLog.findUniqueOrThrow({ where: { id } }) };
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return { data: await this.prisma.auditLog.delete({ where: { id } }) };
  }
}
