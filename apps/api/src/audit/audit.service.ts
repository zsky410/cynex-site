import { Injectable } from "@nestjs/common";
import type { Prisma } from "@cynex/db";
import type { AuditAction, ActorType } from "@cynex/shared";
import { PrismaService } from "../prisma/prisma.service";

export interface AuditLogInput {
  actorType: ActorType;
  actorId?: string | null;
  action: AuditAction | string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(input: AuditLogInput) {
    return this.prisma.auditLog.create({
      data: {
        actorType: input.actorType,
        actorId: input.actorId ?? null,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        metadata: input.metadata,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  }

  logAdminAction(
    adminId: string,
    action: AuditAction | string,
    targetType?: string | null,
    targetId?: string | null,
    metadata?: Prisma.InputJsonValue,
  ) {
    return this.log({
      actorType: "admin",
      actorId: adminId,
      action,
      targetType,
      targetId,
      metadata,
    });
  }
}
