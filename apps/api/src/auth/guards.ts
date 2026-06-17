import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { TokensService } from "./tokens.service";

function extractToken(req: { headers: Record<string, unknown> }): string | null {
  const header = req.headers["authorization"];
  if (typeof header !== "string") return null;
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token ? token : null;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokensService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const token = extractToken(req);
    if (!token) throw new UnauthorizedException();
    let payload;
    try {
      payload = await this.tokens.verifyAccess(token);
    } catch {
      throw new UnauthorizedException();
    }
    if (payload.type !== "user") throw new UnauthorizedException();
    req.user = { id: payload.sub, email: payload.email };
    return true;
  }
}

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly tokens: TokensService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req = ctx.switchToHttp().getRequest();
    const token = extractToken(req);
    if (!token) throw new UnauthorizedException();
    let payload;
    try {
      payload = await this.tokens.verifyAccess(token);
    } catch {
      throw new UnauthorizedException();
    }
    // A normal user token must never unlock admin resources (PRD 15.2).
    if (payload.type !== "admin") throw new UnauthorizedException();
    req.admin = { id: payload.sub, email: payload.email, role: payload.role };
    return true;
  }
}
