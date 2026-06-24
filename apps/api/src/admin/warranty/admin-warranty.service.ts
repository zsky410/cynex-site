import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { AuditAction } from "@cynex/shared";
import { PrismaService } from "../../prisma/prisma.service";
import { parseListQuery } from "../common/list-query";
import { AuditService } from "../../audit/audit.service";
import { WarrantyReplacementService } from "../../warranty/replace";
import { FilesService } from "../../files/files.service";

export interface AdminWarrantyMessageInput {
  message?: string;
  attachmentFileIds?: string[];
}

export interface AdminWarrantyUpdateInput {
  status?: string;
  adminNote?: string | null;
  sourceId?: string | null;
  sourceOrderId?: string | null;
  inventoryAccountId?: string | null;
  inventoryKeyId?: string | null;
}

const CLOSED_STATUSES = new Set(["resolved", "rejected", "closed"]);

@Injectable()
export class AdminWarrantyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FilesService,
    private readonly audit?: AuditService,
    private readonly replacement?: WarrantyReplacementService,
  ) {}

  async list(q: Record<string, any>) {
    const { skip, take, orderBy, filter, ids } = parseListQuery(q);
    const where: any = {};
    if (ids) where.id = { in: ids };
    if (filter.status) where.status = filter.status;
    if (filter.userId) where.userId = filter.userId;
    if (filter.reason) where.reason = filter.reason;
    if (filter.orderId) where.orderId = filter.orderId;
    if (filter.q) {
      const query = String(filter.q);
      where.OR = [
        { order: { orderCode: { contains: query, mode: "insensitive" } } },
        { user: { email: { contains: query, mode: "insensitive" } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.warrantyCase.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          user: { select: { id: true, email: true, name: true } },
          order: { select: { id: true, orderCode: true } },
          orderItem: {
            select: {
              id: true,
              status: true,
              product: { select: { name: true, slug: true } },
              variant: { select: { name: true, warrantyDays: true } },
            },
          },
          _count: { select: { messages: true } },
        },
      }),
      this.prisma.warrantyCase.count({ where }),
    ]);
    return { data, total };
  }

  async getById(id: string) {
    const warrantyCase = await this.prisma.warrantyCase.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, name: true } },
        order: { select: { id: true, orderCode: true, createdAt: true, deliveredAt: true } },
        orderItem: {
          include: {
            product: { select: { id: true, name: true, slug: true } },
            variant: { select: { id: true, name: true, warrantyDays: true } },
            fulfillment: true,
          },
        },
        source: { select: { id: true, name: true, slug: true } },
        sourceOrder: { select: { id: true, status: true, externalRef: true } },
        inventoryAccount: {
          select: { id: true, username: true, accountType: true, status: true },
        },
        inventoryKey: { select: { id: true, status: true, publicNote: true } },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!warrantyCase) {
      throw new NotFoundException("Yêu cầu bảo hành không tồn tại");
    }
    return this.enrichWarrantyCase(warrantyCase);
  }

  async addMessage(adminId: string, id: string, dto: AdminWarrantyMessageInput) {
    const warrantyCase = await this.prisma.warrantyCase.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!warrantyCase) {
      throw new NotFoundException("Yêu cầu bảo hành không tồn tại");
    }
    if (!dto.message?.trim()) {
      throw new BadRequestException("Nội dung phản hồi là bắt buộc");
    }
    if (CLOSED_STATUSES.has(warrantyCase.status)) {
      throw new BadRequestException("Yêu cầu bảo hành đã đóng");
    }
    if (dto.attachmentFileIds?.length) {
      await this.files.assertAdminOwnsFiles(adminId, dto.attachmentFileIds);
    }

    await this.prisma.warrantyMessage.create({
      data: {
        warrantyCaseId: warrantyCase.id,
        authorType: "admin",
        authorId: adminId,
        message: dto.message.trim(),
        attachmentFileIds: dto.attachmentFileIds?.length ? dto.attachmentFileIds : undefined,
      },
    });

    if (warrantyCase.status !== "waiting_customer") {
      await this.prisma.warrantyCase.update({
        where: { id: warrantyCase.id },
        data: { status: "waiting_customer" },
      });
    }

    await this.audit?.logAdminAction(
      adminId,
      AuditAction.ADMIN_UPDATE_WARRANTY_CASE,
      "warranty_case",
      warrantyCase.id,
      {
        kind: "reply",
      },
    );

    return this.getById(warrantyCase.id);
  }

  async updateCase(id: string, body: AdminWarrantyUpdateInput, adminId?: string) {
    const existing = await this.prisma.warrantyCase.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!existing) {
      throw new NotFoundException("Yêu cầu bảo hành không tồn tại");
    }

    const data: Record<string, unknown> = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.adminNote !== undefined) data.adminNote = body.adminNote;
    if (body.sourceId !== undefined) data.sourceId = body.sourceId;
    if (body.sourceOrderId !== undefined) data.sourceOrderId = body.sourceOrderId;
    if (body.inventoryAccountId !== undefined) data.inventoryAccountId = body.inventoryAccountId;
    if (body.inventoryKeyId !== undefined) data.inventoryKeyId = body.inventoryKeyId;

    const nextStatus = typeof body.status === "string" ? body.status : existing.status;
    data.closedAt = CLOSED_STATUSES.has(nextStatus) ? new Date() : null;

    await this.prisma.warrantyCase.update({
      where: { id: existing.id },
      data,
    });
    if (adminId) {
      await this.audit?.logAdminAction(
        adminId,
        AuditAction.ADMIN_UPDATE_WARRANTY_CASE,
        "warranty_case",
        existing.id,
        {
          status: body.status,
          sourceId: body.sourceId,
          sourceOrderId: body.sourceOrderId,
          inventoryAccountId: body.inventoryAccountId,
          inventoryKeyId: body.inventoryKeyId,
        },
      );
    }
    return this.getById(existing.id);
  }

  async replaceAccount(id: string, inventoryAccountId: string, adminId: string) {
    if (!inventoryAccountId) {
      throw new BadRequestException("inventoryAccountId là bắt buộc");
    }
    await this.replacement?.replaceAccount(id, inventoryAccountId, adminId);
    return this.getById(id);
  }

  async replaceKey(id: string, inventoryKeyId: string, adminId: string) {
    if (!inventoryKeyId) {
      throw new BadRequestException("inventoryKeyId là bắt buộc");
    }
    await this.replacement?.replaceKey(id, inventoryKeyId, adminId);
    return this.getById(id);
  }

  private async enrichWarrantyCase<T extends { messages?: Array<{ attachmentFileIds?: unknown }> }>(warrantyCase: T) {
    if (!warrantyCase.messages?.length) return warrantyCase;
    const messages = await Promise.all(
      warrantyCase.messages.map(async (message) => {
        const attachmentFileIds = Array.isArray(message.attachmentFileIds)
          ? message.attachmentFileIds.filter((value): value is string => typeof value === "string" && value.length > 0)
          : [];
        return {
          ...message,
          attachments: await this.files.resolveFilesForAdmin(attachmentFileIds),
        };
      }),
    );
    return {
      ...warrantyCase,
      messages,
    };
  }
}
