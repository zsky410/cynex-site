import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  listProducts() {
    return this.prisma.product.findMany({
      where: { status: "active" },
      orderBy: { sortOrder: "asc" },
      select: {
        id: true,
        name: true,
        slug: true,
        shortDescription: true,
        imageFileId: true,
        category: { select: { id: true, name: true, slug: true } },
        variants: {
          where: { status: { in: ["active", "out_of_stock"] } },
          select: { id: true, name: true, price: true, fulfillmentType: true, status: true },
        },
      },
    });
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
        category: { select: { id: true, name: true, slug: true } },
        variants: {
          where: { status: { in: ["active", "out_of_stock"] } },
          orderBy: { price: "asc" },
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
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
    return product;
  }

  listCategories() {
    return this.prisma.category.findMany({ orderBy: { sortOrder: "asc" } });
  }
}
