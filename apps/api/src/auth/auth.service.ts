import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, randomBytes } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { TokensService, TokenPair } from "./tokens.service";
import { QueueService, EMAIL_JOB } from "../queue/queue.service";
import { hashPassword, verifyPassword } from "./password";
import type { RegisterDto, LoginDto } from "@cynex/shared";
import { EmailType } from "@cynex/shared";

const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

function sha256(v: string): string {
  return createHash("sha256").update(v).digest("hex");
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokensService,
    private readonly queue: QueueService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<TokenPair & { user: { id: string; email: string } }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException("Email đã được sử dụng");
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash: await hashPassword(dto.password),
        name: dto.name,
      },
    });
    const pair = await this.tokens.issue(user.id, "user", { email: user.email });
    return { ...pair, user: { id: user.id, email: user.email } };
  }

  async login(dto: LoginDto): Promise<TokenPair & { user: { id: string; email: string } }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    // Generic error for both unknown email and wrong password to prevent
    // account enumeration (PRD 9.1). We still run verify on a dummy hash to keep
    // timing roughly constant.
    const ok = user
      ? await verifyPassword(user.passwordHash, dto.password)
      : await verifyPassword(
          "$argon2id$v=19$m=65536,t=3,p=4$bm9uY2Vub25jZW5vbmNl$0000000000000000000000000000000000000000000",
          dto.password,
        );
    if (!user || !ok) throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
    if (user.isLocked) throw new UnauthorizedException("Tài khoản đã bị khóa");
    const pair = await this.tokens.issue(user.id, "user", { email: user.email });
    return { ...pair, user: { id: user.id, email: user.email } };
  }

  // Always returns success-shaped response; never reveals whether email exists.
  async forgotPassword(email: string): Promise<{ ok: true }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      const raw = randomBytes(32).toString("hex");
      await this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: sha256(raw),
          expiresAt: new Date(Date.now() + RESET_TTL_MS),
        },
      });
      const link = `${this.config.get("WEB_BASE_URL")}/reset-password?token=${raw}`;
      await this.queue.enqueueEmail(EMAIL_JOB.resetPassword, {
        type: EmailType.reset_password,
        toEmail: user.email,
        userId: user.id,
        link,
      });
    }
    return { ok: true };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ ok: true }> {
    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: sha256(token) },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException("Token không hợp lệ hoặc đã hết hạn");
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { passwordHash: await hashPassword(newPassword) },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
    ]);
    return { ok: true };
  }
}
