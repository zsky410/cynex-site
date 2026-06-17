import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { AdminAuthGuard } from "../../auth/guards";
import { CurrentAdmin, type AuthAdmin } from "../../common/current-user.decorator";
import { AdminRefundService } from "./admin-refund.service";

@UseGuards(AdminAuthGuard)
@Controller("admin/orders")
export class AdminRefundController {
  constructor(private readonly refunds: AdminRefundService) {}

  @Post(":id/refund")
  refund(
    @CurrentAdmin() admin: AuthAdmin,
    @Param("id") id: string,
    @Body() body: { reason?: string },
  ) {
    return this.refunds.refundOrder(admin.id, id, body);
  }
}
