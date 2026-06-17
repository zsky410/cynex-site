import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { WalletService } from "./wallet.service";
import { PaymentService } from "../payment/payment.service";
import { JwtAuthGuard } from "../auth/guards";
import { CurrentUser, AuthUser } from "../common/current-user.decorator";
import { ZodValidationPipe } from "../common/zod-validation.pipe";
import { DepositSchema, type DepositDto } from "@cynex/shared";

@UseGuards(JwtAuthGuard)
@Controller("wallet")
export class WalletController {
  constructor(
    private readonly wallet: WalletService,
    private readonly payment: PaymentService,
  ) {}

  @Get()
  async balance(@CurrentUser() user: AuthUser) {
    return { balance: await this.wallet.getBalance(user.id) };
  }

  @Get("transactions")
  transactions(@CurrentUser() user: AuthUser) {
    return this.wallet.listTransactions(user.id);
  }

  @Post("deposit")
  deposit(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(DepositSchema)) dto: DepositDto,
  ) {
    return this.payment.createDeposit(user.id, dto.amount);
  }
}
