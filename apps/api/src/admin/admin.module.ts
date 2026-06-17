import { Module } from "@nestjs/common";
import { AdminAuthController } from "./admin-auth/admin-auth.controller";
import { AdminProductsController } from "./catalog/admin-products.controller";
import { AdminVariantsController } from "./catalog/admin-variants.controller";
import { AdminOrdersController } from "./orders/admin-orders.controller";
import { AdminFulfillmentController } from "./orders/admin-fulfillment.controller";
import { FulfillmentService } from "./orders/fulfillment.service";
import { AdminUsersController } from "./users/admin-users.controller";
import { AdminSourcesController } from "./sources/admin-sources.controller";
import { AdminSourceOrdersController } from "./sources/admin-source-orders.controller";
import { AdminAccountsController } from "./inventory/admin-accounts.controller";
import { AdminKeysController } from "./inventory/admin-keys.controller";

@Module({
  controllers: [
    AdminAuthController,
    AdminProductsController,
    AdminVariantsController,
    AdminOrdersController,
    AdminFulfillmentController,
    AdminUsersController,
    AdminSourcesController,
    AdminSourceOrdersController,
    AdminAccountsController,
    AdminKeysController,
  ],
  providers: [FulfillmentService],
})
export class AdminModule {}
