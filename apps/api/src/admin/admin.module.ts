import { Module } from "@nestjs/common";
import { AdminAuthController } from "./admin-auth/admin-auth.controller";
import { AdminProductsController } from "./catalog/admin-products.controller";
import { AdminVariantsController } from "./catalog/admin-variants.controller";
import { AdminOrdersController } from "./orders/admin-orders.controller";
import { AdminFulfillmentController } from "./orders/admin-fulfillment.controller";
import { AdminRefundController } from "./orders/admin-refund.controller";
import { FulfillmentService } from "./orders/fulfillment.service";
import { AdminRefundService } from "./orders/admin-refund.service";
import { AdminUsersController } from "./users/admin-users.controller";
import { AdminSourcesController } from "./sources/admin-sources.controller";
import { AdminSourceOrdersController } from "./sources/admin-source-orders.controller";
import { AdminAccountsController } from "./inventory/admin-accounts.controller";
import { AdminKeysController } from "./inventory/admin-keys.controller";
import { AdminRevealController } from "./inventory/reveal.controller";
import { AdminRevealService } from "./inventory/admin-reveal.service";
import { AdminWarrantyController } from "./warranty/admin-warranty.controller";
import { AdminWarrantyService } from "./warranty/admin-warranty.service";
import { AuditService } from "../audit/audit.service";
import { WarrantyReplacementService } from "../warranty/replace";
import { AdminEmailLogsController } from "./logs/admin-email-logs.controller";
import { AdminAuditLogsController } from "./logs/admin-audit-logs.controller";
import { AdminDashboardController } from "./dashboard/dashboard.controller";

@Module({
  controllers: [
    AdminAuthController,
    AdminProductsController,
    AdminVariantsController,
    AdminOrdersController,
    AdminRefundController,
    AdminFulfillmentController,
    AdminUsersController,
    AdminSourcesController,
    AdminSourceOrdersController,
    AdminAccountsController,
    AdminKeysController,
    AdminRevealController,
    AdminWarrantyController,
    AdminEmailLogsController,
    AdminAuditLogsController,
    AdminDashboardController,
  ],
  providers: [
    FulfillmentService,
    AdminRefundService,
    AdminWarrantyService,
    AdminRevealService,
    WarrantyReplacementService,
    AuditService,
  ],
})
export class AdminModule {}
