import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminAuthGuard } from "../../auth/guards";
import { PrismaService } from "../../prisma/prisma.service";
import { AdminIntegrityService } from "../integrity/admin-integrity.service";
import { parseListQuery } from "../common/list-query";
import { encrypt } from "@cynex/shared";

const PLAIN_FIELDS = [
  "productVariantId",
  "sourceId",
  "publicNote",
  "cost",
  "sourceRef",
  "status",
  "warrantyUntil",
] as const;

function mask<T extends Record<string, any>>(k: T) {
  const { keyEncrypted, ...rest } = k;
  return { ...rest, hasKey: !!keyEncrypted };
}

function mapBody(b: Record<string, any>, isCreate: boolean): Record<string, any> {
  const o: Record<string, any> = {};
  for (const f of PLAIN_FIELDS) if (b[f] !== undefined) o[f] = b[f];
  if (b.key !== undefined && b.key !== "") {
    o.keyEncrypted = encrypt(String(b.key));
  } else if (isCreate) {
    throw new BadRequestException("Key là bắt buộc");
  }
  return o;
}

function throwDeleteBlocked(
  id: string,
  blockingDependencies: Array<{ resource: string; count: number; sampleIds: string[] }>,
): never {
  throw new ConflictException({
    message: "Cannot delete inventory key while dependent records exist.",
    resource: "inventory_keys",
    id,
    blockingDependencies,
  });
}

@UseGuards(AdminAuthGuard)
@Controller("admin/inventory-keys")
export class AdminKeysController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly integrity: AdminIntegrityService,
  ) {}

  @Get()
  async list(@Query() q: Record<string, any>) {
    const { skip, take, orderBy, filter, ids } = parseListQuery(q);
    const where: any = {};
    if (ids) where.id = { in: ids };
    if (filter.productVariantId) where.productVariantId = filter.productVariantId;
    if (filter.status) where.status = filter.status;
    if (filter.sourceId) where.sourceId = filter.sourceId;
    const [rows, total] = await Promise.all([
      this.prisma.inventoryKey.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { variant: { select: { name: true } }, source: { select: { name: true } } },
      }),
      this.prisma.inventoryKey.count({ where }),
    ]);
    return { data: rows.map(mask), total };
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    return { data: mask(await this.prisma.inventoryKey.findUniqueOrThrow({ where: { id } })) };
  }

  @Post()
  async create(@Body() b: Record<string, any>) {
    return { data: mask(await this.prisma.inventoryKey.create({ data: mapBody(b, true) as any })) };
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() b: Record<string, any>) {
    return { data: mask(await this.prisma.inventoryKey.update({ where: { id }, data: mapBody(b, false) })) };
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    const preflight = await this.integrity.getInventoryKeyDeletePreflight(id);
    if (!preflight.canDelete) {
      throwDeleteBlocked(id, preflight.blockingDependencies);
    }

    return { data: mask(await this.prisma.inventoryKey.delete({ where: { id } })) };
  }
}
