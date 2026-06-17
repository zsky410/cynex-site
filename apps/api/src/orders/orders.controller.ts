import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { JwtAuthGuard } from "../auth/guards";
import { CurrentUser, AuthUser } from "../common/current-user.decorator";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { CreateOrderSchema, type CreateOrderDto } from "@cynex/shared";

@UseGuards(JwtAuthGuard)
@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(CreateOrderSchema)) dto: CreateOrderDto,
  ) {
    return this.orders.create(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.orders.list(user.id);
  }

  @Get(":orderCode")
  get(@CurrentUser() user: AuthUser, @Param("orderCode") orderCode: string) {
    return this.orders.getByCode(user.id, orderCode);
  }

  @Post(":orderCode/pay-wallet")
  payWallet(@CurrentUser() user: AuthUser, @Param("orderCode") orderCode: string) {
    return this.orders.payWithWallet(user.id, orderCode);
  }
}
