import { Controller, Get, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "./guards";
import { CurrentUser, AuthUser } from "../common/current-user.decorator";
import { PrismaService } from "../prisma/prisma.service";

@Controller("me")
export class MeController {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async me(@CurrentUser() user: AuthUser) {
    return this.prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, name: true, walletBalance: true, createdAt: true },
    });
  }
}
