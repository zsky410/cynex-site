import { Body, Controller, HttpCode, Post, UnauthorizedException } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import { PrismaService } from "../../prisma/prisma.service";
import { TokensService } from "../../auth/tokens.service";
import { verifyPassword } from "../../auth/password";
import { ZodValidationPipe } from "../../common/zod-validation.pipe";
import { LoginSchema, type LoginDto } from "@cynex/shared";

@Controller("admin/auth")
export class AdminAuthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokensService,
  ) {}

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @Post("login")
  async login(@Body(new ZodValidationPipe(LoginSchema)) dto: LoginDto) {
    const admin = await this.prisma.admin.findUnique({ where: { email: dto.email } });
    const ok = admin
      ? await verifyPassword(admin.passwordHash, dto.password)
      : await verifyPassword("$argon2id$v=19$m=65536,t=3,p=4$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", dto.password);
    if (!admin || !ok || !admin.isActive) {
      throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
    }
    const pair = await this.tokens.issue(admin.id, "admin", { email: admin.email, role: admin.role });
    return {
      accessToken: pair.accessToken,
      admin: { id: admin.id, email: admin.email, name: admin.name, role: admin.role },
    };
  }

  @HttpCode(200)
  @Post("logout")
  logout() {
    return { ok: true };
  }
}
