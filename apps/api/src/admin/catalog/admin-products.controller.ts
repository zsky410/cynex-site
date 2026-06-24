import { Body, ConflictException, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { AuditAction } from "@cynex/shared";
import { AdminAuthGuard } from "../../auth/guards";
import { CurrentAdmin, AuthAdmin } from "../../common/current-user.decorator";
import { AuditService } from "../../audit/audit.service";
import { PrismaService } from "../../prisma/prisma.service";
import { parseListQuery } from "../common/list-query";
import { FilesService } from "../../files/files.service";
import { AdminIntegrityService } from "../integrity/admin-integrity.service";
import { type BlockingDependency } from "../integrity/integrity.types";

const FIELDS = [
  "name",
  "slug",
  "shortDescription",
  "description",
  "status",
  "sortOrder",
  "categoryId",
  "imageFileId",
  "guideFileIds",
] as const;

function pick(body: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {};
  for (const k of FIELDS) if (body[k] !== undefined) out[k] = body[k];
  if (out.imageFileId === "") out.imageFileId = null;
  if (Array.isArray(out.guideFileIds)) out.guideFileIds = out.guideFileIds.filter(Boolean);
  return out;
}

function throwDeleteBlocked(id: string, blockingDependencies: BlockingDependency[]): never {
  throw new ConflictException({
    message: "Không thể xóa sản phẩm vì vẫn còn dữ liệu liên kết.",
    resource: "products",
    id,
    blockingDependencies,
  });
}

@UseGuards(AdminAuthGuard)
@Controller("admin/products")
export class AdminProductsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly files: FilesService,
    private readonly integrity: AdminIntegrityService,
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
    return { data: await Promise.all(data.map((row) => this.serialize(row))), total };
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    return { data: await this.serialize(await this.prisma.product.findUniqueOrThrow({ where: { id } })) };
  }

  @Post()
  async create(@CurrentAdmin() admin: AuthAdmin, @Body() body: Record<string, any>) {
    const dataInput = pick(body);
    await this.assertAdminFileRefs(admin.id, dataInput);
    const data = await this.prisma.product.create({ data: dataInput as any });
    await this.audit.logAdminAction(admin.id, AuditAction.ADMIN_CREATE_PRODUCT, "product", data.id);
    return { data: await this.serialize(data) };
  }

  @Patch(":id")
  async update(@CurrentAdmin() admin: AuthAdmin, @Param("id") id: string, @Body() body: Record<string, any>) {
    const dataInput = pick(body);
    await this.assertAdminFileRefs(admin.id, dataInput);
    const data = await this.prisma.product.update({ where: { id }, data: dataInput });
    await this.audit.logAdminAction(admin.id, AuditAction.ADMIN_UPDATE_PRODUCT, "product", id);
    return { data: await this.serialize(data) };
  }

  @Delete(":id")
  async remove(@CurrentAdmin() admin: AuthAdmin, @Param("id") id: string) {
    const preflight = await this.integrity.getProductDeletePreflight(id);
    if (!preflight.canDelete) {
      throwDeleteBlocked(id, preflight.blockingDependencies);
    }
    const deleted = await this.prisma.product.delete({ where: { id } });
    await this.audit.logAdminAction(admin.id, "ADMIN_DELETE_PRODUCT", "product", id);
    return { data: deleted };
  }

  private async assertAdminFileRefs(adminId: string, body: Record<string, any>) {
    const ids = [body.imageFileId, ...(Array.isArray(body.guideFileIds) ? body.guideFileIds : [])].filter(
      (value): value is string => typeof value === "string" && value.length > 0,
    );
    await this.files.assertAdminOwnsFiles(adminId, ids);
  }

  private async serialize<T extends { imageFileId?: string | null; guideFileIds?: unknown }>(row: T) {
    const guideFileIds = Array.isArray(row.guideFileIds)
      ? row.guideFileIds.filter((value): value is string => typeof value === "string" && value.length > 0)
      : [];
    const [image] = row.imageFileId ? await this.files.resolveFilesForAdmin([row.imageFileId]) : [];
    const guideFiles = await this.files.resolveFilesForAdmin(guideFileIds);
    return {
      ...row,
      image: image ?? null,
      guideFiles,
    };
  }
}
