import {
  BadRequestException,
  Body,
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
import { parseListQuery } from "../common/list-query";
import { encrypt, encryptNullable } from "@cynex/shared";

const PLAIN_FIELDS = [
  "productVariantId",
  "sourceId",
  "username",
  "publicNote",
  "accountType",
  "maxSlots",
  "expiresAt",
  "cost",
  "sourceRef",
  "status",
] as const;

// Strips encrypted columns from any account record before returning it.
function mask<T extends Record<string, any>>(a: T) {
  const { passwordEncrypted, recoveryInfoEncrypted, noteEncrypted, ...rest } = a;
  return {
    ...rest,
    hasPassword: !!passwordEncrypted,
    hasRecoveryInfo: !!recoveryInfoEncrypted,
    hasPrivateNote: !!noteEncrypted,
  };
}

function mapBody(b: Record<string, any>, isCreate: boolean): Record<string, any> {
  const o: Record<string, any> = {};
  for (const k of PLAIN_FIELDS) if (b[k] !== undefined) o[k] = b[k];
  // Secrets arrive as plaintext (password/recoveryInfo/privateNote) and are
  // encrypted at rest (PRD 15.3). On update, only re-encrypt provided fields.
  if (b.password !== undefined) {
    if (isCreate && !b.password) throw new BadRequestException("Mật khẩu là bắt buộc");
    o.passwordEncrypted = encrypt(String(b.password));
  } else if (isCreate) {
    throw new BadRequestException("Mật khẩu là bắt buộc");
  }
  if (b.recoveryInfo !== undefined) o.recoveryInfoEncrypted = encryptNullable(b.recoveryInfo);
  if (b.privateNote !== undefined) o.noteEncrypted = encryptNullable(b.privateNote);
  return o;
}

@UseGuards(AdminAuthGuard)
@Controller("admin/inventory-accounts")
export class AdminAccountsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async list(@Query() q: Record<string, any>) {
    const { skip, take, orderBy, filter, ids } = parseListQuery(q);
    const where: any = {};
    if (ids) where.id = { in: ids };
    if (filter.productVariantId) where.productVariantId = filter.productVariantId;
    if (filter.status) where.status = filter.status;
    if (filter.accountType) where.accountType = filter.accountType;
    if (filter.sourceId) where.sourceId = filter.sourceId;
    const [rows, total] = await Promise.all([
      this.prisma.inventoryAccount.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          variant: { select: { name: true } },
          source: { select: { name: true } },
        },
      }),
      this.prisma.inventoryAccount.count({ where }),
    ]);
    return { data: rows.map(mask), total };
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const a = await this.prisma.inventoryAccount.findUniqueOrThrow({ where: { id } });
    return { data: mask(a) };
  }

  @Post()
  async create(@Body() b: Record<string, any>) {
    const data = mapBody(b, true);
    if (b.accountType === "shared" && (!data.maxSlots || Number(data.maxSlots) < 1)) {
      data.maxSlots = b.maxSlots ?? 1;
    }
    const a = await this.prisma.inventoryAccount.create({ data: data as any });
    return { data: mask(a) };
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() b: Record<string, any>) {
    const a = await this.prisma.inventoryAccount.update({ where: { id }, data: mapBody(b, false) });
    return { data: mask(a) };
  }

  @Delete(":id")
  async remove(@Param("id") id: string) {
    const a = await this.prisma.inventoryAccount.update({ where: { id }, data: { status: "disabled" } });
    return { data: mask(a) };
  }
}
