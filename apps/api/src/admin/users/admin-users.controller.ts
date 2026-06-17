import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { AdminAuthGuard } from "../../auth/guards";
import { CurrentAdmin, AuthAdmin } from "../../common/current-user.decorator";
import { PrismaService } from "../../prisma/prisma.service";
import { WalletService } from "../../wallet/wallet.service";
import { parseListQuery } from "../common/list-query";
import { AuditService } from "../../audit/audit.service";
import { AuditAction } from "@cynex/shared";

@UseGuards(AdminAuthGuard)
@Controller("admin/users")
export class AdminUsersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wallet: WalletService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  async list(@Query() q: Record<string, any>) {
    const { skip, take, orderBy, filter, ids } = parseListQuery(q);
    const where: any = {};
    if (ids) where.id = { in: ids };
    if (filter.q) where.email = { contains: String(filter.q), mode: "insensitive" };
    if (filter.isLocked !== undefined) where.isLocked = filter.isLocked;
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        select: { id: true, email: true, name: true, walletBalance: true, isLocked: true, createdAt: true },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data: rows, total };
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        walletBalance: true,
        isLocked: true,
        createdAt: true,
        walletTxns: { orderBy: { createdAt: "desc" }, take: 50 },
        orders: { orderBy: { createdAt: "desc" }, take: 50, select: { id: true, orderCode: true, totalAmount: true, paymentStatus: true, fulfillmentStatus: true, createdAt: true } },
      },
    });
    return { data: user };
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() body: Record<string, any>) {
    // Only the lock flag is editable directly; balance must go through adjustments.
    const data: any = {};
    if (body.isLocked !== undefined) data.isLocked = !!body.isLocked;
    if (body.name !== undefined) data.name = body.name;
    const user = await this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, walletBalance: true, isLocked: true, createdAt: true },
    });
    return { data: user };
  }

  @Post(":id/wallet-adjustment")
  async adjust(
    @CurrentAdmin() admin: AuthAdmin,
    @Param("id") id: string,
    @Body() body: { amount?: number; reason?: string },
  ) {
    const amount = Number(body.amount);
    if (!Number.isFinite(amount) || amount === 0) {
      throw new BadRequestException("Số tiền điều chỉnh không hợp lệ");
    }
    if (!body.reason || !body.reason.trim()) {
      throw new BadRequestException("Bắt buộc nhập lý do điều chỉnh");
    }
    const balanceAfter = await this.prisma.$transaction((tx) =>
      this.wallet.applyDelta(tx, id, amount, "admin_adjustment", {
        description: body.reason,
        createdByAdminId: admin.id,
        referenceType: "admin_adjustment",
      }),
    );
    await this.audit.logAdminAction(admin.id, AuditAction.ADMIN_ADJUST_WALLET, "user", id, {
      amount,
      reason: body.reason,
      balanceAfter,
    });
    return { data: { id, balanceAfter } };
  }
}
