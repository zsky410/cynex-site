import { Controller, Param, Post, UseGuards } from "@nestjs/common";
import { AdminAuthGuard } from "../../auth/guards";
import { CurrentAdmin, type AuthAdmin } from "../../common/current-user.decorator";
import { AdminRevealService } from "./admin-reveal.service";

@UseGuards(AdminAuthGuard)
@Controller("admin")
export class AdminRevealController {
  constructor(private readonly reveal: AdminRevealService) {}

  @Post("inventory-accounts/:id/reveal")
  async revealAccount(@CurrentAdmin() admin: AuthAdmin, @Param("id") id: string) {
    return { data: await this.reveal.revealAccount(admin.id, id) };
  }

  @Post("inventory-keys/:id/reveal")
  async revealKey(@CurrentAdmin() admin: AuthAdmin, @Param("id") id: string) {
    return { data: await this.reveal.revealKey(admin.id, id) };
  }
}
