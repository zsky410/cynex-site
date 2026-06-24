import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { BlockingDependency, DeletePreflightResult, IntegrityWarning } from "./integrity.types";

@Injectable()
export class AdminIntegrityService {
  constructor(private readonly prisma: PrismaService) {}

  getSupplySourceWarnings(): IntegrityWarning[] {
    return [];
  }

  getSourceOrderWarnings(row: {
    sourceId?: string | null;
    source?: { id: string } | null;
  }): IntegrityWarning[] {
    const warnings: IntegrityWarning[] = [];

    if (row.sourceId && row.source === null) {
      warnings.push({
        code: "missing_source",
        message: "Source order references a supply source that no longer exists.",
        field: "sourceId",
        relatedResource: "supply_sources",
        relatedId: row.sourceId,
      });
    }

    return warnings;
  }

  getInventoryAccountWarnings(row: {
    productVariantId?: string | null;
    sourceId?: string | null;
    variant?: { id: string } | null;
    source?: { id: string } | null;
  }): IntegrityWarning[] {
    const warnings: IntegrityWarning[] = [];

    if (row.productVariantId && row.variant === null) {
      warnings.push({
        code: "missing_variant",
        message: "Inventory account references a product variant that no longer exists.",
        field: "productVariantId",
        relatedResource: "product_variants",
        relatedId: row.productVariantId,
      });
    }

    if (!row.sourceId) {
      warnings.push({
        code: "missing_source",
        message: "Inventory account is not linked to a supply source.",
        field: "sourceId",
        relatedResource: "supply_sources",
      });
    } else if (row.source === null) {
      warnings.push({
        code: "missing_source",
        message: "Inventory account references a supply source that no longer exists.",
        field: "sourceId",
        relatedResource: "supply_sources",
        relatedId: row.sourceId,
      });
    }

    return warnings;
  }

  getInventoryKeyWarnings(row: {
    productVariantId?: string | null;
    sourceId?: string | null;
    variant?: { id: string } | null;
    source?: { id: string } | null;
  }): IntegrityWarning[] {
    const warnings: IntegrityWarning[] = [];

    if (row.productVariantId && row.variant === null) {
      warnings.push({
        code: "missing_variant",
        message: "Inventory key references a product variant that no longer exists.",
        field: "productVariantId",
        relatedResource: "product_variants",
        relatedId: row.productVariantId,
      });
    }

    if (!row.sourceId) {
      warnings.push({
        code: "missing_source",
        message: "Inventory key is not linked to a supply source.",
        field: "sourceId",
        relatedResource: "supply_sources",
      });
    } else if (row.source === null) {
      warnings.push({
        code: "missing_source",
        message: "Inventory key references a supply source that no longer exists.",
        field: "sourceId",
        relatedResource: "supply_sources",
        relatedId: row.sourceId,
      });
    }

    return warnings;
  }

  getEmailLogWarnings(row: {
    userId?: string | null;
    orderId?: string | null;
    user?: { id: string } | null;
    order?: { id: string } | null;
  }): IntegrityWarning[] {
    const warnings: IntegrityWarning[] = [];

    if (row.userId && row.user === null) {
      warnings.push({
        code: "missing_user",
        message: "Email log references a user that no longer exists.",
        field: "userId",
        relatedResource: "users",
        relatedId: row.userId,
      });
    }

    if (row.orderId && row.order === null) {
      warnings.push({
        code: "missing_order",
        message: "Email log references an order that no longer exists.",
        field: "orderId",
        relatedResource: "orders",
        relatedId: row.orderId,
      });
    }

    return warnings;
  }

  async getAuditLogWarnings(row: {
    targetType?: string | null;
    targetId?: string | null;
  }): Promise<IntegrityWarning[]> {
    if (!row.targetType || !row.targetId) {
      return [];
    }

    if (row.targetType === "order") {
      const order = await this.prisma.order.findUnique({
        where: { id: row.targetId },
        select: { id: true },
      });
      if (!order) {
        return [
          {
            code: "missing_order",
            message: "Audit log references an order that no longer exists.",
            field: "targetId",
            relatedResource: "orders",
            relatedId: row.targetId,
          },
        ];
      }
    }

    if (row.targetType === "user") {
      const user = await this.prisma.user.findUnique({
        where: { id: row.targetId },
        select: { id: true },
      });
      if (!user) {
        return [
          {
            code: "missing_user",
            message: "Audit log references a user that no longer exists.",
            field: "targetId",
            relatedResource: "users",
            relatedId: row.targetId,
          },
        ];
      }
    }

    return [];
  }

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
