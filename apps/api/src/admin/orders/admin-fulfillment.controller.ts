import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { AdminAuthGuard } from "../../auth/guards";
import { CurrentAdmin, type AuthAdmin } from "../../common/current-user.decorator";
import { FulfillmentService } from "./fulfillment.service";

@UseGuards(AdminAuthGuard)
@Controller("admin/fulfillments")
export class AdminFulfillmentController {
  constructor(private readonly fulfillment: FulfillmentService) {}

  @Post(":id/mark-processing")
  markProcessing(@Param("id") id: string) {
    return this.fulfillment.markProcessing(id);
  }

  @Post(":id/assign-account")
  assignAccount(@Param("id") id: string, @Body() b: { inventoryAccountId: string }) {
    return this.fulfillment.assignAccount(id, b.inventoryAccountId);
  }

  @Post(":id/assign-key")
  assignKey(@Param("id") id: string, @Body() b: { inventoryKeyId: string }) {
    return this.fulfillment.assignKey(id, b.inventoryKeyId);
  }

  @Post(":id/manual")
  manual(@Param("id") id: string, @Body() b: { note: string }) {
    return this.fulfillment.setManual(id, b.note);
  }

  @Post(":id/preview-delivery-email")
  preview(@Param("id") id: string) {
    return this.fulfillment.previewDelivery(id);
  }

  @Post(":id/send-delivery-email")
  send(@Param("id") id: string, @CurrentAdmin() admin: AuthAdmin, @Body() b: { confirm?: boolean }) {
    return this.fulfillment.sendDelivery(id, admin.id, b?.confirm === true);
  }
}
