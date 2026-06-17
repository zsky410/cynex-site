import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard } from "@nestjs/throttler";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { MeController } from "./me.controller";
import { TokensService } from "./tokens.service";
import { JwtAuthGuard, AdminAuthGuard } from "./guards";

@Global()
@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController, MeController],
  providers: [
    AuthService,
    TokensService,
    JwtAuthGuard,
    AdminAuthGuard,
    // Global rate limiting (PRD 9.1 / 10.1).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
  exports: [TokensService, JwtAuthGuard, AdminAuthGuard],
})
export class AuthModule {}
