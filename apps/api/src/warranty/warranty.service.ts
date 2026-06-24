import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { Prisma } from "@cynex/db";
import { PrismaService } from "../prisma/prisma.service";
import type { CreateWarrantyCaseDto, CreateWarrantyMessageDto } from "@cynex/shared";
import { FilesService } from "../files/files.service";

@Injectable()
export class WarrantyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FilesService,
  ) {}

  async create(userId: string, dto: CreateWarrantyCaseDto) {
    const item = await this.prisma.orderItem.findFirst({
      where: {
        id: dto.orderItemId,
        orderId: dto.orderId,
        order: { userId },
      },
      include: {
        order: {
          select: {
            id: true,
            orderCode: true,
            deliveredAt: true,
          },
        },
        variant: {
          select: {
            id: true,
            name: true,
            warrantyDays: true,
          },
        },
        fulfillment: {
          select: {
            id: true,
            status: true,
            deliveredAt: true,
            inventoryAccountId: true,
            inventoryKeyId: true,
            sourceOrderId: true,
          },
        },
      },
    });
    if (!item) {
      throw new NotFoundException("Đơn hàng không tồn tại");
    }
    if (item.status !== "delivered" || item.fulfillment?.status !== "delivered") {
      throw new BadRequestException("Chỉ có thể tạo bảo hành cho đơn đã giao");
    }
    if (item.variant.warrantyDays <= 0) {
      throw new BadRequestException("Sản phẩm này không hỗ trợ bảo hành");
    }

    const deliveredAt = item.fulfillment.deliveredAt ?? item.order.deliveredAt;
    if (deliveredAt) {
      const expiresAt = new Date(deliveredAt);
      expiresAt.setDate(expiresAt.getDate() + item.variant.warrantyDays);
      if (expiresAt.getTime() < Date.now()) {
        throw new BadRequestException("Đơn hàng đã hết hạn bảo hành");
      }
    }

    const existingOpenCase = await this.prisma.warrantyCase.findFirst({
      where: {
        orderItemId: item.id,
        status: {
          in: ["open", "waiting_admin", "waiting_customer", "processing"],
        },
      },
      select: { id: true },
    });
    if (existingOpenCase) {
      throw new BadRequestException("Mục này đang có yêu cầu bảo hành đang mở");
    }

    if (dto.attachmentFileIds?.length) {
      await this.files.assertUserOwnsFiles(userId, dto.attachmentFileIds);
    }

    const created = await this.prisma.warrantyCase.create({
      data: {
        userId,
        orderId: item.orderId,
        orderItemId: item.id,
        inventoryAccountId: item.fulfillment.inventoryAccountId,
        inventoryKeyId: item.fulfillment.inventoryKeyId,
        sourceOrderId: item.fulfillment.sourceOrderId,
        reason: dto.reason,
        status: "open",
        messages: {
          create: {
            authorType: "user",
            authorId: userId,
            message: dto.message.trim(),
            attachmentFileIds: dto.attachmentFileIds as Prisma.InputJsonValue | undefined,
          },
        },
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
    return this.enrichWarrantyCase(created, userId);
  }

  async list(userId: string) {
    return this.prisma.warrantyCase.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: {
            id: true,
            orderCode: true,
          },
        },
        orderItem: {
          select: {
            id: true,
            status: true,
            product: { select: { name: true, slug: true } },
            variant: { select: { name: true, warrantyDays: true } },
          },
        },
        _count: {
          select: { messages: true },
        },
      },
    });
  }

  async getById(userId: string, id: string) {
    const warrantyCase = await this.prisma.warrantyCase.findFirst({
      where: { id, userId },
      include: {
        order: {
          select: {
            id: true,
            orderCode: true,
            createdAt: true,
            deliveredAt: true,
          },
        },
        orderItem: {
          select: {
            id: true,
            status: true,
            product: { select: { id: true, name: true, slug: true } },
            variant: {
              select: {
                id: true,
                name: true,
                warrantyDays: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
    if (!warrantyCase) {
      throw new NotFoundException("Yêu cầu bảo hành không tồn tại");
    }
    return this.enrichWarrantyCase(warrantyCase, userId);
  }

  async addMessage(userId: string, id: string, dto: CreateWarrantyMessageDto) {
    const warrantyCase = await this.prisma.warrantyCase.findFirst({
      where: { id, userId },
      select: { id: true, status: true },
    });
    if (!warrantyCase) {
      throw new NotFoundException("Yêu cầu bảo hành không tồn tại");
    }
    if (["resolved", "rejected", "closed"].includes(warrantyCase.status)) {
      throw new BadRequestException("Yêu cầu bảo hành đã đóng");
    }

    if (dto.attachmentFileIds?.length) {
      await this.files.assertUserOwnsFiles(userId, dto.attachmentFileIds);
    }

    await this.prisma.warrantyMessage.create({
      data: {
        warrantyCaseId: warrantyCase.id,
        authorType: "user",
        authorId: userId,
        message: dto.message.trim(),
        attachmentFileIds: dto.attachmentFileIds as Prisma.InputJsonValue | undefined,
      },
    });

    if (warrantyCase.status === "waiting_customer") {
      await this.prisma.warrantyCase.update({
        where: { id: warrantyCase.id },
        data: { status: "waiting_admin" },
      });
    }

    return this.getById(userId, warrantyCase.id);
  }

  private async enrichWarrantyCase<T extends { messages?: Array<{ attachmentFileIds?: unknown }> }>(
    warrantyCase: T,
    userId: string,
  ) {
    if (!warrantyCase.messages?.length) return warrantyCase;
    const messages = await Promise.all(
      warrantyCase.messages.map(async (message) => {
        const attachmentFileIds = Array.isArray(message.attachmentFileIds)
          ? message.attachmentFileIds.filter((value): value is string => typeof value === "string" && value.length > 0)
          : [];
        return {
          ...message,
          attachments: await this.files.resolveFilesForUser(userId, attachmentFileIds),
        };
      }),
    );
    return {
      ...warrantyCase,
      messages,
    };
  }
}
