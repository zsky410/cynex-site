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

    const [sourceOrders, inventoryAccounts, inventoryKeys, productVariants, warrantyCases] = await Promise.all([
      this.loadDependencyRows(this.prisma.sourceOrder, { sourceId: id }),
      this.loadDependencyRows(this.prisma.inventoryAccount, { sourceId: id }),
      this.loadDependencyRows(this.prisma.inventoryKey, { sourceId: id }),
      this.loadDependencyRows(this.prisma.productVariant, { defaultSourceId: id }),
      this.loadDependencyRows(this.prisma.warrantyCase, { sourceId: id }),
    ]);

    const blockingDependencies = [
      this.toBlockingDependency("source_orders", sourceOrders),
      this.toBlockingDependency("inventory_accounts", inventoryAccounts),
      this.toBlockingDependency("inventory_keys", inventoryKeys),
      this.toBlockingDependency("product_variants", productVariants),
      this.toBlockingDependency("warranty_cases", warrantyCases),
    ].filter((dependency): dependency is BlockingDependency => dependency !== null);

    return {
      canDelete: blockingDependencies.length === 0,
      blockingDependencies,
    };
  }

  async getSourceOrderDeletePreflight(id: string): Promise<DeletePreflightResult> {
    await this.prisma.sourceOrder.findUniqueOrThrow({
      where: { id },
      select: { id: true },
    });

    const [fulfillments, warrantyCases] = await Promise.all([
      this.loadDependencyRows(this.prisma.orderFulfillment, { sourceOrderId: id }),
      this.loadDependencyRows(this.prisma.warrantyCase, { sourceOrderId: id }),
    ]);

    const blockingDependencies = [
      this.toBlockingDependency("order_fulfillments", fulfillments),
      this.toBlockingDependency("warranty_cases", warrantyCases),
    ].filter((dependency): dependency is BlockingDependency => dependency !== null);

    return {
      canDelete: blockingDependencies.length === 0,
      blockingDependencies,
    };
  }

  async getInventoryAccountDeletePreflight(id: string): Promise<DeletePreflightResult> {
    await this.prisma.inventoryAccount.findUniqueOrThrow({
      where: { id },
      select: { id: true },
    });

    const [allocations, fulfillments, warrantyCases, auditLogs] = await Promise.all([
      this.loadDependencyRows(this.prisma.accountAllocation, { inventoryAccountId: id }),
      this.loadDependencyRows(this.prisma.orderFulfillment, { inventoryAccountId: id }),
      this.loadDependencyRows(this.prisma.warrantyCase, { inventoryAccountId: id }),
      this.loadDependencyRows(this.prisma.auditLog, {
        OR: [
          { targetType: "inventory_account", targetId: id },
          { metadata: { path: ["inventoryAccountId"], equals: id } },
          { metadata: { path: ["oldInventoryAccountId"], equals: id } },
          { metadata: { path: ["newInventoryAccountId"], equals: id } },
        ],
      }),
    ]);

    const blockingDependencies = [
      this.toBlockingDependency("account_allocations", allocations),
      this.toBlockingDependency("order_fulfillments", fulfillments),
      this.toBlockingDependency("warranty_cases", warrantyCases),
      this.toBlockingDependency("audit_logs", auditLogs),
    ].filter((dependency): dependency is BlockingDependency => dependency !== null);

    return {
      canDelete: blockingDependencies.length === 0,
      blockingDependencies,
    };
  }

  async getInventoryKeyDeletePreflight(id: string): Promise<DeletePreflightResult> {
    const key = await this.prisma.inventoryKey.findUniqueOrThrow({
      where: { id },
      select: { soldOrderItemId: true },
    });

    const [fulfillments, warrantyCases, auditLogs] = await Promise.all([
      this.loadDependencyRows(this.prisma.orderFulfillment, { inventoryKeyId: id }),
      this.loadDependencyRows(this.prisma.warrantyCase, { inventoryKeyId: id }),
      this.loadDependencyRows(this.prisma.auditLog, {
        OR: [
          { targetType: "inventory_key", targetId: id },
          { metadata: { path: ["inventoryKeyId"], equals: id } },
          { metadata: { path: ["oldInventoryKeyId"], equals: id } },
          { metadata: { path: ["newInventoryKeyId"], equals: id } },
        ],
      }),
    ]);

    const soldOrderItems = key.soldOrderItemId
      ? { count: 1, sampleIds: [key.soldOrderItemId] }
      : { count: 0, sampleIds: [] };

    const blockingDependencies = [
      this.toBlockingDependency("sold_order_items", soldOrderItems),
      this.toBlockingDependency("order_fulfillments", fulfillments),
      this.toBlockingDependency("warranty_cases", warrantyCases),
      this.toBlockingDependency("audit_logs", auditLogs),
    ].filter((dependency): dependency is BlockingDependency => dependency !== null);

    return {
      canDelete: blockingDependencies.length === 0,
      blockingDependencies,
    };
  }

  async getAuditLogDeletePreflight(id: string): Promise<DeletePreflightResult> {
    await this.prisma.auditLog.findUniqueOrThrow({
      where: { id },
      select: { id: true },
    });

    return {
      canDelete: true,
      blockingDependencies: [],
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
