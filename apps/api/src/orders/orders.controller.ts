import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { OrdersService } from "./orders.service";
import { JwtAuthGuard } from "../auth/guards";
import { CurrentUser, AuthUser } from "../common/current-user.decorator";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import {
  CreateOrderSchema,
  UpdateOrderCustomerInputSchema,
  type CreateOrderDto,
  type UpdateOrderCustomerInputDto,
} from "@cynex/shared";

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

  @Patch(":orderCode/customer-input")
  updateCustomerInput(
    @CurrentUser() user: AuthUser,
    @Param("orderCode") orderCode: string,
    @Body(new ZodValidationPipe(UpdateOrderCustomerInputSchema)) dto: UpdateOrderCustomerInputDto,
  ) {
    return this.orders.updateCustomerInput(user.id, orderCode, dto);
  }

  @Post(":orderCode/pay-wallet")
  payWallet(@CurrentUser() user: AuthUser, @Param("orderCode") orderCode: string) {
    return this.orders.payWithWallet(user.id, orderCode);
  }
}
