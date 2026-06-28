import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FilesService } from "../files/files.service";

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly files: FilesService,
  ) {}

  async listProducts() {
    const products = await this.prisma.product.findMany({
      where: { status: "active" },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        imageFileId: true,
        guideFileIds: true,
        category: { select: { id: true, name: true, slug: true } },
        variants: {
          where: { status: { in: ["active", "out_of_stock"] } },
          select: { id: true, name: true, price: true, discountPercent: true, fulfillmentType: true, status: true },
        },
      },
    });
    return Promise.all(products.map((product) => this.serializeProduct(product)));
  }

  async getProduct(slug: string) {
    const product = await this.prisma.product.findFirst({
      where: { slug, status: "active" },
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        description: true,
        imageFileId: true,
        guideFileIds: true,
        category: { select: { id: true, name: true, slug: true } },
        variants: {
          where: { status: { in: ["active", "out_of_stock"] } },
          orderBy: { price: "asc" },
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            discountPercent: true,
            durationDays: true,
            fulfillmentType: true,
            warrantyDays: true,
            estimatedDeliveryMinutes: true,
            requiresCustomerInput: true,
            customerInputSchema: true,
            status: true,
          },
        },
      },
    });
    if (!product) throw new NotFoundException("Sản phẩm không tồn tại");
    return this.serializeProduct(product);
  }

  listCategories() {
    return this.prisma.category.findMany({
      where: {
        products: {
          some: {
            status: "active",
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  private async serializeProduct<
    T extends { imageFileId?: string | null; guideFileIds?: unknown },
  >(product: T) {
    const guideFileIds = Array.isArray(product.guideFileIds)
      ? product.guideFileIds.filter((value): value is string => typeof value === "string" && value.length > 0)
      : [];
    const [image] = product.imageFileId ? await this.files.resolvePublicFiles([product.imageFileId]) : [];
    const guideFiles = await this.files.resolvePublicFiles(guideFileIds);
    return {
      ...product,
      image: image ?? null,
      guideFiles,
    };
  }
}
