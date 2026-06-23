import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

export type Principal = "user" | "admin";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class TokensService {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async issue(sub: string, type: Principal, extra: Record<string, unknown> = {}): Promise<TokenPair> {
    const accessToken = await this.jwt.signAsync(
      { sub, type, ...extra },
      {
        secret: this.config.getOrThrow("JWT_ACCESS_SECRET"),
        expiresIn: Number(this.config.get("JWT_ACCESS_TTL") ?? 900),
      },
    );
    const refreshToken = await this.jwt.signAsync(
      { sub, type, ...extra },
      {
        secret: this.config.getOrThrow("JWT_REFRESH_SECRET"),
        expiresIn: Number(this.config.get("JWT_REFRESH_TTL") ?? 1209600),
      },
    );
    return { accessToken, refreshToken };
  }

  async verifyAccess(token: string): Promise<{ sub: string; type: Principal; [k: string]: unknown }> {
    return this.jwt.verifyAsync(token, {
      secret: this.config.getOrThrow("JWT_ACCESS_SECRET"),
    });
  }

  async verifyRefresh(token: string): Promise<{ sub: string; type: Principal; [k: string]: unknown }> {
    return this.jwt.verifyAsync(token, {
      secret: this.config.getOrThrow("JWT_REFRESH_SECRET"),
    });
  }
}
