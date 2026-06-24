import { ConflictException, Controller, Delete, Get, Param, Query, UseGuards } from "@nestjs/common";
import { AdminAuthGuard } from "../../auth/guards";
import { CurrentAdmin, type AuthAdmin } from "../../common/current-user.decorator";
import { PrismaService } from "../../prisma/prisma.service";
import { parseListQuery } from "../common/list-query";
import { AdminIntegrityService } from "../integrity/admin-integrity.service";
import { type BlockingDependency } from "../integrity/integrity.types";
import { AuditService } from "../../audit/audit.service";

function throwDeleteBlocked(id: string, blockingDependencies: BlockingDependency[]): never {
  throw new ConflictException({
    message: "Không thể xóa đơn hàng vì vẫn còn dữ liệu liên kết.",
    resource: "orders",
    id,
    blockingDependencies,
  });
}

@UseGuards(AdminAuthGuard)
@Controller("admin/orders")
export class AdminOrdersController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly integrity: AdminIntegrityService,
    private readonly audit: AuditService,
  ) {}

  @Get()
  async list(@Query() q: Record<string, any>) {
    const { skip, take, orderBy, filter, ids } = parseListQuery(q);
    const where: any = {};
    if (ids) where.id = { in: ids };
    if (filter.paymentStatus) where.paymentStatus = filter.paymentStatus;
    if (filter.fulfillmentStatus) where.fulfillmentStatus = filter.fulfillmentStatus;
    if (filter.userId) where.userId = filter.userId;
    if (filter.q) where.orderCode = { contains: String(filter.q), mode: "insensitive" };
    const [data, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take,
        orderBy,
        include: { user: { select: { email: true } } },
      }),
      this.prisma.order.count({ where }),
    ]);
    return { data, total };
  }

  @Get(":id")
  async getOne(@Param("id") id: string) {
    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        payments: true,
        items: {
          include: {
            product: { select: { name: true } },
            variant: { select: { name: true, fulfillmentType: true } },
            fulfillment: true,
          },
        },
      },
    });
    return { data: order };
  }

  @Delete(":id")
  async remove(@CurrentAdmin() admin: AuthAdmin, @Param("id") id: string) {
    const preflight = await this.integrity.getOrderDeletePreflight(id);
    if (!preflight.canDelete) {
      throwDeleteBlocked(id, preflight.blockingDependencies);
    }

    const deleted = await this.prisma.$transaction(async (tx) => {
      const orderItems = await tx.orderItem.findMany({
        where: { orderId: id },
        select: { id: true },
      });
      const orderItemIds = orderItems.map((item) => item.id);

      if (orderItemIds.length) {
        await tx.inventoryKey.updateMany({
          where: { soldOrderItemId: { in: orderItemIds } },
          data: { soldOrderItemId: null },
        });
        await tx.accountAllocation.deleteMany({
          where: { orderItemId: { in: orderItemIds } },
        });
      }

      await tx.emailLog.deleteMany({ where: { orderId: id } });
      await tx.payment.deleteMany({ where: { orderId: id } });
      await tx.warrantyCase.deleteMany({
        where: {
          OR: [
            { orderId: id },
            ...(orderItemIds.length ? [{ orderItemId: { in: orderItemIds } }] : []),
          ],
        },
      });
      return tx.order.delete({ where: { id } });
    });

    await this.audit.logAdminAction(admin.id, "ADMIN_DELETE_ORDER", "order", id);
    return { data: deleted };
  }
}
