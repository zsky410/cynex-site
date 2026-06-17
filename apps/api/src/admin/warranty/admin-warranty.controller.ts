import {
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
import { CurrentAdmin, type AuthAdmin } from "../../common/current-user.decorator";
import { AdminWarrantyService } from "./admin-warranty.service";

@UseGuards(AdminAuthGuard)
@Controller("admin/warranty-cases")
export class AdminWarrantyController {
  constructor(private readonly warranty: AdminWarrantyService) {}

  @Get()
  list(@Query() q: Record<string, any>) {
    return this.warranty.list(q);
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    return { data: await this.warranty.getById(id) };
  }

  @Post(":id/messages")
  async addMessage(
    @CurrentAdmin() admin: AuthAdmin,
    @Param("id") id: string,
    @Body() body: { message?: string; attachmentFileIds?: string[] },
  ) {
    return { data: await this.warranty.addMessage(admin.id, id, body) };
  }

  @Patch(":id")
  async updateCase(
    @CurrentAdmin() admin: AuthAdmin,
    @Param("id") id: string,
    @Body()
    body: {
      status?: string;
      adminNote?: string | null;
      sourceId?: string | null;
      sourceOrderId?: string | null;
      inventoryAccountId?: string | null;
      inventoryKeyId?: string | null;
    },
  ) {
    return { data: await this.warranty.updateCase(id, body, admin.id) };
  }

  @Post(":id/replace-account")
  async replaceAccount(
    @CurrentAdmin() admin: AuthAdmin,
    @Param("id") id: string,
    @Body() body: { inventoryAccountId?: string },
  ) {
    return { data: await this.warranty.replaceAccount(id, body.inventoryAccountId ?? "", admin.id) };
  }

  @Post(":id/replace-key")
  async replaceKey(
    @CurrentAdmin() admin: AuthAdmin,
    @Param("id") id: string,
    @Body() body: { inventoryKeyId?: string },
  ) {
    return { data: await this.warranty.replaceKey(id, body.inventoryKeyId ?? "", admin.id) };
  }
}
