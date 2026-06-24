import { Body, ConflictException, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { AuditAction } from "@cynex/shared";
import { AdminAuthGuard } from "../../auth/guards";
import { CurrentAdmin, AuthAdmin } from "../../common/current-user.decorator";
import { AuditService } from "../../audit/audit.service";
import { PrismaService } from "../../prisma/prisma.service";
import { AdminIntegrityService } from "../integrity/admin-integrity.service";
import { type BlockingDependency } from "../integrity/integrity.types";
import { parseListQuery } from "../common/list-query";

const FIELDS = [
  "name",
  "slug",
  "contactName",
  "contactChannel",
  "contactUrl",
  "websiteUrl",
  "telegramUsername",
  "discordUsername",
  "email",
  "phone",
  "defaultWarrantyDays",
  "warrantyPolicy",
  "notes",
  "rating",
  "status",
] as const;

function pick(b: Record<string, any>): Record<string, any> {
  const o: Record<string, any> = {};
  for (const k of FIELDS) if (b[k] !== undefined) o[k] = b[k];
  return o;
}

function throwDeleteBlocked(
  resource: string,
  id: string,
  message: string,
  blockingDependencies: BlockingDependency[],
): never {
  throw new ConflictException({
    message,
    resource,
    id,
    blockingDependencies,
  });
}

@UseGuards(AdminAuthGuard)
@Controller("admin/supply-sources")
export class AdminSourcesController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly integrity: AdminIntegrityService,
  ) {}

  @Get()
  async list(@Query() q: Record<string, any>) {
    const { skip, take, orderBy, filter, ids } = parseListQuery(q);
    const where: any = {};
    if (ids) where.id = { in: ids };
    if (filter.status) where.status = filter.status;
    if (filter.q) where.name = { contains: String(filter.q), mode: "insensitive" };
    const [data, total] = await Promise.all([
      this.prisma.supplySource.findMany({ where, skip, take, orderBy }),
      this.prisma.supplySource.count({ where }),
    ]);
    return { data, total };
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    return { data: await this.prisma.supplySource.findUniqueOrThrow({ where: { id } }) };
  }

  @Post()
  async create(@CurrentAdmin() admin: AuthAdmin, @Body() b: Record<string, any>) {
    const data = await this.prisma.supplySource.create({ data: pick(b) as any });
    await this.audit.logAdminAction(admin.id, AuditAction.ADMIN_CREATE_SOURCE, "supply_source", data.id);
    return { data };
  }

  @Patch(":id")
  async update(@CurrentAdmin() admin: AuthAdmin, @Param("id") id: string, @Body() b: Record<string, any>) {
    const data = await this.prisma.supplySource.update({ where: { id }, data: pick(b) });
    await this.audit.logAdminAction(admin.id, AuditAction.ADMIN_UPDATE_SOURCE, "supply_source", id);
    return { data };
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    const preflight = await this.integrity.getSupplySourceDeletePreflight(id);
    if (!preflight.canDelete) {
      throwDeleteBlocked(
        "supply_sources",
        id,
        "Cannot delete supply source while dependent records exist.",
        preflight.blockingDependencies,
      );
    }

    return { data: await this.prisma.supplySource.delete({ where: { id } }) };
  }
}
