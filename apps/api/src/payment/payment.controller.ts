import { Controller, Param, Post, UseGuards } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { JwtAuthGuard } from "../auth/guards";
import { CurrentUser, AuthUser } from "../common/current-user.decorator";

@UseGuards(JwtAuthGuard)
@Controller("orders")
export class PaymentController {
  constructor(private readonly payment: PaymentService) {}

  @Post(":orderCode/pay")
  pay(@CurrentUser() user: AuthUser, @Param("orderCode") orderCode: string) {
    return this.payment.createOrderPayment(user.id, orderCode);
  }
}
