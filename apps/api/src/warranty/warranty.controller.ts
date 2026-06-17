import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards";
import { CurrentUser, type AuthUser } from "../common/current-user.decorator";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import {
  CreateWarrantyMessageSchema,
  CreateWarrantyCaseSchema,
  type CreateWarrantyCaseDto,
  type CreateWarrantyMessageDto,
} from "@cynex/shared";
import { WarrantyService } from "./warranty.service";

@UseGuards(JwtAuthGuard)
@Controller("warranty-cases")
export class WarrantyController {
  constructor(private readonly warranty: WarrantyService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateWarrantyCaseSchema)) dto: CreateWarrantyCaseDto,
  ) {
    return this.warranty.create(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.warranty.list(user.id);
  }

  @Get(":id")
  getById(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.warranty.getById(user.id, id);
  }

  @Post(":id/messages")
  addMessage(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Body(new ZodValidationPipe(CreateWarrantyMessageSchema)) dto: CreateWarrantyMessageDto,
  ) {
    return this.warranty.addMessage(user.id, id, dto);
  }
}
