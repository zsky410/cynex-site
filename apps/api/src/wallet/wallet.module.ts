import { Global, Module, forwardRef } from "@nestjs/common";
import { WalletService } from "./wallet.service";
import { WalletController } from "./wallet.controller";
import { PaymentModule } from "../payment/payment.module";

// Global so PaymentModule (and admin) can inject WalletService without re-importing.
@Global()
@Module({
  imports: [forwardRef(() => PaymentModule)],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
