-- CreateEnum
CREATE TYPE "FulfillmentType" AS ENUM ('CUSTOMER_ACCOUNT_UPGRADE', 'DEDICATED_ACCOUNT', 'SHARED_ACCOUNT', 'LICENSE_KEY', 'MANUAL_DELIVERY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('waiting_payment', 'paid_waiting_admin', 'processing', 'assigned', 'delivered', 'failed', 'cancelled', 'refunded');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('payos', 'sepay', 'wallet', 'manual');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('draft', 'active', 'inactive', 'archived');

-- CreateEnum
CREATE TYPE "VariantStatus" AS ENUM ('active', 'inactive', 'out_of_stock', 'archived');

-- CreateEnum
CREATE TYPE "InventoryAccountStatus" AS ENUM ('available', 'assigned', 'delivered', 'full', 'replaced', 'disabled', 'expired');

-- CreateEnum
CREATE TYPE "InventoryKeyStatus" AS ENUM ('available', 'assigned', 'delivered', 'invalid', 'replaced', 'refunded');

-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('dedicated', 'shared');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('active', 'expired', 'replaced', 'cancelled');

-- CreateEnum
CREATE TYPE "SourceOrderStatus" AS ENUM ('not_ordered', 'ordered', 'waiting_source', 'source_delivered', 'source_failed', 'claimed_warranty', 'cancelled');

-- CreateEnum
CREATE TYPE "WarrantyCaseStatus" AS ENUM ('open', 'waiting_admin', 'waiting_customer', 'processing', 'resolved', 'rejected', 'closed');

-- CreateEnum
CREATE TYPE "WarrantyReason" AS ENUM ('cannot_login', 'wrong_password', 'key_invalid', 'premium_missing', 'account_limited', 'need_instruction', 'other');

-- CreateEnum
CREATE TYPE "WalletTransactionType" AS ENUM ('deposit', 'purchase', 'refund', 'admin_adjustment');

-- CreateEnum
CREATE TYPE "EmailType" AS ENUM ('verify_email', 'reset_password', 'payment_confirmed', 'wallet_deposit_confirmed', 'delivery', 'refund', 'warranty_update');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('queued', 'sent', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "SupplySourceStatus" AS ENUM ('active', 'inactive', 'blocked', 'archived');

-- CreateEnum
CREATE TYPE "ContactChannel" AS ENUM ('internal', 'telegram', 'discord', 'website', 'facebook', 'email', 'phone', 'other');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('admin', 'super_admin');

-- CreateEnum
CREATE TYPE "ActorType" AS ENUM ('user', 'admin', 'system');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "walletBalance" INTEGER NOT NULL DEFAULT 0,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "role" "AdminRole" NOT NULL DEFAULT 'admin',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "shortDescription" TEXT,
    "description" TEXT,
    "imageFileId" TEXT,
    "status" "ProductStatus" NOT NULL DEFAULT 'draft',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "costEstimate" INTEGER,
    "durationDays" INTEGER,
    "fulfillmentType" "FulfillmentType" NOT NULL,
    "defaultSourceId" TEXT,
    "warrantyDays" INTEGER NOT NULL DEFAULT 0,
    "estimatedDeliveryMinutes" INTEGER,
    "requiresCustomerInput" BOOLEAN NOT NULL DEFAULT false,
    "customerInputSchema" JSONB,
    "status" "VariantStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "orderCode" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalAmount" INTEGER NOT NULL,
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'waiting_payment',
    "paymentMethod" "PaymentProvider",
    "paidAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" INTEGER NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "fulfillmentType" "FulfillmentType" NOT NULL,
    "customerInput" JSONB,
    "status" "FulfillmentStatus" NOT NULL DEFAULT 'waiting_payment',

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "paymentCode" TEXT NOT NULL,
    "orderId" TEXT,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "isDeposit" BOOLEAN NOT NULL DEFAULT false,
    "providerPaymentId" TEXT,
    "providerTransactionId" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
    "checkoutUrl" TEXT,
    "qrCode" TEXT,
    "rawWebhookPayload" JSONB,
    "paidAt" TIMESTAMP(3),
    "expiredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "WalletTransactionType" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceBefore" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "description" TEXT,
    "createdByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supply_sources" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "contactName" TEXT,
    "contactChannel" "ContactChannel" NOT NULL DEFAULT 'internal',
    "contactUrl" TEXT,
    "websiteUrl" TEXT,
    "telegramUsername" TEXT,
    "discordUsername" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "defaultWarrantyDays" INTEGER NOT NULL DEFAULT 0,
    "warrantyPolicy" TEXT,
    "notes" TEXT,
    "rating" INTEGER,
    "status" "SupplySourceStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supply_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_orders" (
    "id" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "orderId" TEXT,
    "orderItemId" TEXT,
    "externalRef" TEXT,
    "cost" INTEGER,
    "status" "SourceOrderStatus" NOT NULL DEFAULT 'not_ordered',
    "sourcePayloadEncrypted" TEXT,
    "proofFileId" TEXT,
    "note" TEXT,
    "orderedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "source_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_accounts" (
    "id" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "sourceId" TEXT,
    "username" TEXT NOT NULL,
    "passwordEncrypted" TEXT NOT NULL,
    "recoveryInfoEncrypted" TEXT,
    "noteEncrypted" TEXT,
    "publicNote" TEXT,
    "accountType" "AccountType" NOT NULL DEFAULT 'dedicated',
    "maxSlots" INTEGER NOT NULL DEFAULT 1,
    "usedSlots" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "cost" INTEGER,
    "sourceRef" TEXT,
    "status" "InventoryAccountStatus" NOT NULL DEFAULT 'available',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_allocations" (
    "id" TEXT NOT NULL,
    "inventoryAccountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3),
    "status" "AllocationStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_allocations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory_keys" (
    "id" TEXT NOT NULL,
    "productVariantId" TEXT NOT NULL,
    "sourceId" TEXT,
    "keyEncrypted" TEXT NOT NULL,
    "publicNote" TEXT,
    "cost" INTEGER,
    "sourceRef" TEXT,
    "status" "InventoryKeyStatus" NOT NULL DEFAULT 'available',
    "soldOrderItemId" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "warrantyUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inventory_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_fulfillments" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "fulfillmentType" "FulfillmentType" NOT NULL,
    "status" "FulfillmentStatus" NOT NULL DEFAULT 'waiting_payment',
    "inventoryAccountId" TEXT,
    "inventoryKeyId" TEXT,
    "accountAllocationId" TEXT,
    "sourceOrderId" TEXT,
    "manualNote" TEXT,
    "deliveredMessageEncrypted" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "deliveredByAdminId" TEXT,
    "emailSentAt" TIMESTAMP(3),
    "emailSentByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_fulfillments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warranty_cases" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "sourceId" TEXT,
    "sourceOrderId" TEXT,
    "inventoryAccountId" TEXT,
    "inventoryKeyId" TEXT,
    "reason" "WarrantyReason" NOT NULL,
    "status" "WarrantyCaseStatus" NOT NULL DEFAULT 'open',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "warranty_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "warranty_messages" (
    "id" TEXT NOT NULL,
    "warrantyCaseId" TEXT NOT NULL,
    "authorType" "ActorType" NOT NULL,
    "authorId" TEXT,
    "message" TEXT NOT NULL,
    "attachmentFileIds" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "warranty_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" TEXT NOT NULL,
    "ownerType" TEXT,
    "ownerId" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageDriver" TEXT NOT NULL DEFAULT 'r2',
    "storageBucket" TEXT,
    "storageKey" TEXT NOT NULL,
    "publicUrl" TEXT,
    "uploadedByUserId" TEXT,
    "uploadedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "orderId" TEXT,
    "type" "EmailType" NOT NULL,
    "toEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodySnapshot" TEXT,
    "status" "EmailStatus" NOT NULL DEFAULT 'queued',
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "sentByAdminId" TEXT,
    "dedupeKey" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorType" "ActorType" NOT NULL,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");

-- CreateIndex
CREATE INDEX "products_status_idx" ON "products"("status");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_slug_key" ON "product_variants"("slug");

-- CreateIndex
CREATE INDEX "product_variants_productId_idx" ON "product_variants"("productId");

-- CreateIndex
CREATE INDEX "product_variants_status_idx" ON "product_variants"("status");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderCode_key" ON "orders"("orderCode");

-- CreateIndex
CREATE INDEX "orders_userId_idx" ON "orders"("userId");

-- CreateIndex
CREATE INDEX "orders_paymentStatus_idx" ON "orders"("paymentStatus");

-- CreateIndex
CREATE INDEX "orders_fulfillmentStatus_idx" ON "orders"("fulfillmentStatus");

-- CreateIndex
CREATE INDEX "order_items_orderId_idx" ON "order_items"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_paymentCode_key" ON "payments"("paymentCode");

-- CreateIndex
CREATE UNIQUE INDEX "payments_providerTransactionId_key" ON "payments"("providerTransactionId");

-- CreateIndex
CREATE INDEX "payments_orderId_idx" ON "payments"("orderId");

-- CreateIndex
CREATE INDEX "payments_userId_idx" ON "payments"("userId");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "wallet_transactions_userId_idx" ON "wallet_transactions"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "supply_sources_slug_key" ON "supply_sources"("slug");

-- CreateIndex
CREATE INDEX "source_orders_sourceId_idx" ON "source_orders"("sourceId");

-- CreateIndex
CREATE INDEX "source_orders_status_idx" ON "source_orders"("status");

-- CreateIndex
CREATE INDEX "inventory_accounts_productVariantId_idx" ON "inventory_accounts"("productVariantId");

-- CreateIndex
CREATE INDEX "inventory_accounts_status_idx" ON "inventory_accounts"("status");

-- CreateIndex
CREATE INDEX "account_allocations_inventoryAccountId_idx" ON "account_allocations"("inventoryAccountId");

-- CreateIndex
CREATE INDEX "account_allocations_orderItemId_idx" ON "account_allocations"("orderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "inventory_keys_soldOrderItemId_key" ON "inventory_keys"("soldOrderItemId");

-- CreateIndex
CREATE INDEX "inventory_keys_productVariantId_idx" ON "inventory_keys"("productVariantId");

-- CreateIndex
CREATE INDEX "inventory_keys_status_idx" ON "inventory_keys"("status");

-- CreateIndex
CREATE UNIQUE INDEX "order_fulfillments_orderItemId_key" ON "order_fulfillments"("orderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "order_fulfillments_accountAllocationId_key" ON "order_fulfillments"("accountAllocationId");

-- CreateIndex
CREATE INDEX "order_fulfillments_status_idx" ON "order_fulfillments"("status");

-- CreateIndex
CREATE INDEX "warranty_cases_userId_idx" ON "warranty_cases"("userId");

-- CreateIndex
CREATE INDEX "warranty_cases_status_idx" ON "warranty_cases"("status");

-- CreateIndex
CREATE INDEX "warranty_messages_warrantyCaseId_idx" ON "warranty_messages"("warrantyCaseId");

-- CreateIndex
CREATE UNIQUE INDEX "email_logs_dedupeKey_key" ON "email_logs"("dedupeKey");

-- CreateIndex
CREATE INDEX "email_logs_type_idx" ON "email_logs"("type");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_targetType_targetId_idx" ON "audit_logs"("targetType", "targetId");

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_defaultSourceId_fkey" FOREIGN KEY ("defaultSourceId") REFERENCES "supply_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_orders" ADD CONSTRAINT "source_orders_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "supply_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_accounts" ADD CONSTRAINT "inventory_accounts_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_accounts" ADD CONSTRAINT "inventory_accounts_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "supply_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_allocations" ADD CONSTRAINT "account_allocations_inventoryAccountId_fkey" FOREIGN KEY ("inventoryAccountId") REFERENCES "inventory_accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_allocations" ADD CONSTRAINT "account_allocations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_allocations" ADD CONSTRAINT "account_allocations_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_keys" ADD CONSTRAINT "inventory_keys_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "product_variants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_keys" ADD CONSTRAINT "inventory_keys_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "supply_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory_keys" ADD CONSTRAINT "inventory_keys_soldOrderItemId_fkey" FOREIGN KEY ("soldOrderItemId") REFERENCES "order_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_fulfillments" ADD CONSTRAINT "order_fulfillments_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_fulfillments" ADD CONSTRAINT "order_fulfillments_inventoryAccountId_fkey" FOREIGN KEY ("inventoryAccountId") REFERENCES "inventory_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_fulfillments" ADD CONSTRAINT "order_fulfillments_inventoryKeyId_fkey" FOREIGN KEY ("inventoryKeyId") REFERENCES "inventory_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_fulfillments" ADD CONSTRAINT "order_fulfillments_sourceOrderId_fkey" FOREIGN KEY ("sourceOrderId") REFERENCES "source_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranty_cases" ADD CONSTRAINT "warranty_cases_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranty_cases" ADD CONSTRAINT "warranty_cases_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranty_cases" ADD CONSTRAINT "warranty_cases_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranty_cases" ADD CONSTRAINT "warranty_cases_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "supply_sources"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranty_cases" ADD CONSTRAINT "warranty_cases_sourceOrderId_fkey" FOREIGN KEY ("sourceOrderId") REFERENCES "source_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranty_cases" ADD CONSTRAINT "warranty_cases_inventoryAccountId_fkey" FOREIGN KEY ("inventoryAccountId") REFERENCES "inventory_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranty_cases" ADD CONSTRAINT "warranty_cases_inventoryKeyId_fkey" FOREIGN KEY ("inventoryKeyId") REFERENCES "inventory_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "warranty_messages" ADD CONSTRAINT "warranty_messages_warrantyCaseId_fkey" FOREIGN KEY ("warrantyCaseId") REFERENCES "warranty_cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_logs" ADD CONSTRAINT "email_logs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
