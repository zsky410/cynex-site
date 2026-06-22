import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { AuditAction } from "@cynex/shared";
import { AdminAuthGuard } from "../../auth/guards";
import { CurrentAdmin, AuthAdmin } from "../../common/current-user.decorator";
import { AuditService } from "../../audit/audit.service";
import { PrismaService } from "../../prisma/prisma.service";
import { parseListQuery } from "../common/list-query";

const FIELDS = [
  "name",
  "slug",
  "shortDescription",
  "description",
  "status",
  "sortOrder",
  "categoryId",
  "imageFileId",
] as const;

function pick(body: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const k of FIELDS) if (body[k] !== undefined) out[k] = body[k];
  return out;
}

@UseGuards(AdminAuthGuard)
@Controller("admin/products")
export class AdminProductsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  async list(@Query() q: Record<string, any>) {
    const { skip, take, orderBy, filter, ids } = parseListQuery(q);
    const where: any = {};
    if (ids) where.id = { in: ids };
    if (filter.status) where.status = filter.status;
    if (filter.categoryId) where.categoryId = filter.categoryId;
    if (filter.q) where.name = { contains: String(filter.q), mode: "insensitive" };
    const [data, total] = await Promise.all([
      this.prisma.product.findMany({ where, skip, take, orderBy }),
      this.prisma.product.count({ where }),
    ]);
    return { data, total };
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    return { data: await this.prisma.product.findUniqueOrThrow({ where: { id } }) };
  }

  @Post()
  async create(@CurrentAdmin() admin: AuthAdmin, @Body() body: Record<string, any>) {
    const data = await this.prisma.product.create({ data: pick(body) as any });
    await this.audit.logAdminAction(admin.id, AuditAction.ADMIN_CREATE_PRODUCT, "product", data.id);
    return { data };
  }

  @Patch(":id")
  async update(@CurrentAdmin() admin: AuthAdmin, @Param("id") id: string, @Body() body: Record<string, any>) {
    const data = await this.prisma.product.update({ where: { id }, data: pick(body) });
    await this.audit.logAdminAction(admin.id, AuditAction.ADMIN_UPDATE_PRODUCT, "product", id);
    return { data };
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return { data: await this.prisma.product.update({ where: { id }, data: { status: "archived" } }) };
  }
}
