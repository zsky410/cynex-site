import { Body, ConflictException, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { AdminAuthGuard } from "../../auth/guards";
import { CurrentAdmin, type AuthAdmin } from "../../common/current-user.decorator";
import { PrismaService } from "../../prisma/prisma.service";
import { AdminIntegrityService } from "../integrity/admin-integrity.service";
import { type BlockingDependency } from "../integrity/integrity.types";
import { parseListQuery } from "../common/list-query";
import { encryptNullable } from "@cynex/shared";
import { FilesService } from "../../files/files.service";

const PLAIN_FIELDS = [
  "sourceId",
  "orderId",
  "orderItemId",
  "externalRef",
  "cost",
  "status",
  "note",
  "orderedAt",
  "deliveredAt",
] as const;

// `sourcePayload` (plaintext) -> sourcePayloadEncrypted at rest.
function mapBody(b: Record<string, any>): Record<string, any> {
  const o: Record<string, any> = {};
  for (const k of PLAIN_FIELDS) if (b[k] !== undefined) o[k] = b[k];
  if (b.proofFileIds !== undefined) {
    o.proofFileIds = Array.isArray(b.proofFileIds) ? b.proofFileIds.filter(Boolean) : [];
  }
  if (b.sourcePayload !== undefined) o.sourcePayloadEncrypted = encryptNullable(b.sourcePayload);
  return o;
}

function serializeSourceOrder<T extends { sourcePayloadEncrypted?: string | null }>(row: T) {
  const { sourcePayloadEncrypted, ...rest } = row;
  return {
    ...rest,
    hasSourcePayload: !!sourcePayloadEncrypted,
  };
}

function withIntegrityWarnings<
  T extends { sourcePayloadEncrypted?: string | null; sourceId?: string | null; source?: { id: string } | null },
>(
  integrity: AdminIntegrityService,
  row: T,
) {
  return {
    ...serializeSourceOrder(row),
    integrityWarnings: integrity.getSourceOrderWarnings(row),
  };
}

function throwDeleteBlocked(
  id: string,
  blockingDependencies: BlockingDependency[],
): never {
  throw new ConflictException({
    message: "Không thể xóa đơn nhập nguồn vì vẫn còn dữ liệu liên kết.",
    resource: "source_orders",
    id,
    blockingDependencies,
  });
}

@UseGuards(AdminAuthGuard)
@Controller("admin/source-orders")
export class AdminSourceOrdersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly integrity: AdminIntegrityService,
    private readonly files: FilesService,
  ) {}

  @Get()
  async list(@Query() q: Record<string, any>) {
    const { skip, take, orderBy, filter, ids } = parseListQuery(q);
    const where: any = {};
    if (ids) where.id = { in: ids };
    if (filter.sourceId) where.sourceId = filter.sourceId;
    if (filter.status) where.status = filter.status;
    if (filter.orderId) where.orderId = filter.orderId;
    const [rows, total] = await Promise.all([
      this.prisma.sourceOrder.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { source: { select: { id: true, name: true } } },
      }),
      this.prisma.sourceOrder.count({ where }),
    ]);
    // Never leak the encrypted payload in list/getOne.
    const data = await Promise.all(rows.map((row) => this.serialize(row, true)));
    return { data, total };
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const row = await this.prisma.sourceOrder.findUniqueOrThrow({
      where: { id },
      include: { source: { select: { id: true, name: true } } },
    });
    return { data: await this.serialize(row, true) };
  }

  @Post()
  async create(@CurrentAdmin() admin: AuthAdmin, @Body() b: Record<string, any>) {
    await this.assertAdminFileRefs(admin.id, b);
    const row = await this.prisma.sourceOrder.create({
      data: mapBody(b) as any,
    });
    return { data: await this.serialize(row, false) };
  }

  @Patch(":id")
  async update(@CurrentAdmin() admin: AuthAdmin, @Param("id") id: string, @Body() b: Record<string, any>) {
    await this.assertAdminFileRefs(admin.id, b);
    const row = await this.prisma.sourceOrder.update({
      where: { id },
      data: mapBody(b),
    });
    return { data: await this.serialize(row, false) };
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    const preflight = await this.integrity.getSourceOrderDeletePreflight(id);
    if (!preflight.canDelete) {
      throwDeleteBlocked(id, preflight.blockingDependencies);
    }

    return { data: await this.prisma.sourceOrder.delete({ where: { id } }) };
  }

  private async assertAdminFileRefs(adminId: string, body: Record<string, any>) {
    const proofFileIds = Array.isArray(body.proofFileIds)
      ? body.proofFileIds.filter((value): value is string => typeof value === "string" && value.length > 0)
      : [];
    await this.files.assertAdminOwnsFiles(adminId, proofFileIds);
  }

  private async serialize<
    T extends { sourcePayloadEncrypted?: string | null; proofFileIds?: unknown; sourceId?: string | null; source?: { id: string } | null },
  >(row: T, includeIntegrityWarnings: boolean) {
    const proofFileIds = Array.isArray(row.proofFileIds)
      ? row.proofFileIds.filter((value): value is string => typeof value === "string" && value.length > 0)
      : [];
    const proofFiles = await this.files.resolveFilesForAdmin(proofFileIds);
    const base = {
      ...serializeSourceOrder(row),
      proofFiles,
    };
    return includeIntegrityWarnings ? { ...base, integrityWarnings: this.integrity.getSourceOrderWarnings(row) } : base;
  }
}
