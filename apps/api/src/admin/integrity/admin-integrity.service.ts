import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { BlockingDependency, DeletePreflightResult } from "./integrity.types";

@Injectable()
export class AdminIntegrityService {
  constructor(private readonly prisma: PrismaService) {}

  async getSupplySourceDeletePreflight(id: string): Promise<DeletePreflightResult> {
    await this.prisma.supplySource.findUniqueOrThrow({
      where: { id },
      select: { id: true },
    });

    const [sourceOrders, inventoryAccounts, inventoryKeys, productVariants] = await Promise.all([
      this.loadDependencyRows("source_orders", this.prisma.sourceOrder, { sourceId: id }),
      this.loadDependencyRows("inventory_accounts", this.prisma.inventoryAccount, { sourceId: id }),
      this.loadDependencyRows("inventory_keys", this.prisma.inventoryKey, { sourceId: id }),
      this.loadDependencyRows("product_variants", this.prisma.productVariant, { defaultSourceId: id }),
    ]);

    const blockingDependencies = [
      this.toBlockingDependency("source_orders", sourceOrders),
      this.toBlockingDependency("inventory_accounts", inventoryAccounts),
      this.toBlockingDependency("inventory_keys", inventoryKeys),
      this.toBlockingDependency("product_variants", productVariants),
    ].filter((dependency): dependency is BlockingDependency => dependency !== null);

    return {
      canDelete: blockingDependencies.length === 0,
      blockingDependencies,
    };
  }

  private toBlockingDependency(
    resource: string,
    dependency: { count: number; sampleIds: string[] },
  ): BlockingDependency | null {
    if (dependency.count === 0) return null;
    return {
      resource,
      count: dependency.count,
      sampleIds: dependency.sampleIds,
    };
  }

  private async loadDependencyRows(
    _resource: string,
    model: {
      count(args: { where: Record<string, any> }): Promise<number>;
      findMany(args: {
        where: Record<string, any>;
        select: { id: true };
        take: number;
      }): Promise<Array<{ id: string }>>;
    },
    where: Record<string, any>,
  ): Promise<{ count: number; sampleIds: string[] }> {
    const [count, rows] = await Promise.all([
      model.count({ where }),
      model.findMany({
        where,
        select: { id: true },
        take: 5,
      }),
    ]);

    return {
      count,
      sampleIds: rows.map((row) => row.id),
    };
  }
}
