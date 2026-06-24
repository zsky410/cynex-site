import { Body, ConflictException, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { AdminAuthGuard } from "../../auth/guards";
import { PrismaService } from "../../prisma/prisma.service";
import { AdminIntegrityService } from "../integrity/admin-integrity.service";
import { type BlockingDependency } from "../integrity/integrity.types";
import { parseListQuery } from "../common/list-query";
import { encryptNullable } from "@cynex/shared";

const PLAIN_FIELDS = [
  "sourceId",
  "orderId",
  "orderItemId",
  "externalRef",
  "cost",
  "status",
  "proofFileId",
  "note",
  "orderedAt",
  "deliveredAt",
] as const;

// `sourcePayload` (plaintext) -> sourcePayloadEncrypted at rest.
function mapBody(b: Record<string, any>): Record<string, any> {
  const o: Record<string, any> = {};
  for (const k of PLAIN_FIELDS) if (b[k] !== undefined) o[k] = b[k];
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
    message: "Cannot delete source order while dependent records exist.",
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
    const data = rows.map((row) => withIntegrityWarnings(this.integrity, row));
    return { data, total };
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const row = await this.prisma.sourceOrder.findUniqueOrThrow({
      where: { id },
      include: { source: { select: { id: true, name: true } } },
    });
    return { data: withIntegrityWarnings(this.integrity, row) };
  }

  @Post()
  async create(@Body() b: Record<string, any>) {
    const row = await this.prisma.sourceOrder.create({
      data: mapBody(b) as any,
    });
    return { data: serializeSourceOrder(row) };
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() b: Record<string, any>) {
    const row = await this.prisma.sourceOrder.update({
      where: { id },
      data: mapBody(b),
    });
    return { data: serializeSourceOrder(row) };
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    const preflight = await this.integrity.getSourceOrderDeletePreflight(id);
    if (!preflight.canDelete) {
      throwDeleteBlocked(id, preflight.blockingDependencies);
    }

    return { data: await this.prisma.sourceOrder.delete({ where: { id } }) };
  }
}
