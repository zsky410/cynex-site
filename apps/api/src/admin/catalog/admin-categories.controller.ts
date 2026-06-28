import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { AdminAuthGuard } from "../../auth/guards";
import { CurrentAdmin, AuthAdmin } from "../../common/current-user.decorator";
import { AuditService } from "../../audit/audit.service";
import { PrismaService } from "../../prisma/prisma.service";
import { parseListQuery } from "../common/list-query";

const FIELDS = ["name", "slug"] as const;

function pick(body: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const field of FIELDS) if (body[field] !== undefined) out[field] = body[field];
  return out;
}

@UseGuards(AdminAuthGuard)
@Controller("admin/categories")
export class AdminCategoriesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  async list(@Query() q: Record<string, any>) {
    const { skip, take, orderBy, filter, ids } = parseListQuery(q);
    const where: Record<string, any> = {};
    if (ids) where.id = { in: ids };
    if (filter.q) {
      where.OR = [
        { name: { contains: String(filter.q), mode: "insensitive" } },
        { slug: { contains: String(filter.q), mode: "insensitive" } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.category.findMany({ where, skip, take, orderBy }),
      this.prisma.category.count({ where }),
    ]);
    return { data, total };
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    return { data: await this.prisma.category.findUniqueOrThrow({ where: { id } }) };
  }

  @Post()
  async create(@CurrentAdmin() admin: AuthAdmin, @Body() body: Record<string, any>) {
    const data = await this.prisma.category.create({ data: pick(body) as any });
    await this.audit.logAdminAction(admin.id, "ADMIN_CREATE_CATEGORY", "category", data.id);
    return { data };
  }

  @Patch(":id")
  async update(@CurrentAdmin() admin: AuthAdmin, @Param("id") id: string, @Body() body: Record<string, any>) {
    const data = await this.prisma.category.update({ where: { id }, data: pick(body) });
    await this.audit.logAdminAction(admin.id, "ADMIN_UPDATE_CATEGORY", "category", id);
    return { data };
  }

  @Delete(":id")
  async remove(@CurrentAdmin() admin: AuthAdmin, @Param("id") id: string) {
    const data = await this.prisma.$transaction(async (tx) => {
      await tx.product.updateMany({ where: { categoryId: id }, data: { categoryId: null } });
      return tx.category.delete({ where: { id } });
    });
    await this.audit.logAdminAction(admin.id, "ADMIN_DELETE_CATEGORY", "category", id);
    return { data };
  }
}
