import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { AuditAction } from "@cynex/shared";
import { AdminAuthGuard } from "../../auth/guards";
import { CurrentAdmin, AuthAdmin } from "../../common/current-user.decorator";
import { AuditService } from "../../audit/audit.service";
import { PrismaService } from "../../prisma/prisma.service";
import { parseListQuery } from "../common/list-query";

const FIELDS = [
  "productId",
  "name",
  "slug",
  "price",
  "costEstimate",
  "durationDays",
  "fulfillmentType",
  "defaultSourceId",
  "warrantyDays",
  "estimatedDeliveryMinutes",
  "requiresCustomerInput",
  "customerInputSchema",
  "status",
] as const;

function pick(body: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const k of FIELDS) if (body[k] !== undefined) out[k] = body[k];
  return out;
}

@UseGuards(AdminAuthGuard)
@Controller("admin/product-variants")
export class AdminVariantsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  async list(@Query() q: Record<string, any>) {
    const { skip, take, orderBy, filter, ids } = parseListQuery(q);
    const where: any = {};
    if (ids) where.id = { in: ids };
    if (filter.productId) where.productId = filter.productId;
    if (filter.status) where.status = filter.status;
    if (filter.fulfillmentType) where.fulfillmentType = filter.fulfillmentType;
    if (filter.q) where.name = { contains: String(filter.q), mode: "insensitive" };
    const [data, total] = await Promise.all([
      this.prisma.productVariant.findMany({ where, skip, take, orderBy }),
      this.prisma.productVariant.count({ where }),
    ]);
    return { data, total };
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    return { data: await this.prisma.productVariant.findUniqueOrThrow({ where: { id } }) };
  }

  @Post()
  async create(@CurrentAdmin() admin: AuthAdmin, @Body() body: Record<string, any>) {
    const data = await this.prisma.productVariant.create({ data: pick(body) as any });
    await this.audit.logAdminAction(admin.id, AuditAction.ADMIN_CREATE_VARIANT, "product_variant", data.id);
    return { data };
  }

  @Patch(":id")
  async update(@CurrentAdmin() admin: AuthAdmin, @Param("id") id: string, @Body() body: Record<string, any>) {
    const data = await this.prisma.productVariant.update({ where: { id }, data: pick(body) });
    await this.audit.logAdminAction(admin.id, AuditAction.ADMIN_UPDATE_VARIANT, "product_variant", id);
    return { data };
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    return { data: await this.prisma.productVariant.update({ where: { id }, data: { status: "archived" } }) };
  }
}
