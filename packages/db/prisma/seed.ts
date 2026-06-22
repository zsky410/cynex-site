import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import * as argon2 from "argon2";
import { PrismaClient } from "@prisma/client";
import { encrypt } from "@cynex/shared";

loadDotenv({ path: resolve(process.cwd(), "../../.env") });
loadDotenv();

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const superAdminEmail = "admin@cynex.local";
  const passwordHash = await argon2.hash("admin12345");

  await prisma.admin.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      email: superAdminEmail,
      passwordHash,
      name: "Super Admin",
      role: "super_admin",
    },
  });

  const streaming = await prisma.category.upsert({
    where: { slug: "streaming" },
    update: {},
    create: { name: "Streaming", slug: "streaming", sortOrder: 1 },
  });

  const ai = await prisma.category.upsert({
    where: { slug: "ai-tools" },
    update: {},
    create: { name: "AI Tools", slug: "ai-tools", sortOrder: 2 },
  });

  const cynexSource = await prisma.supplySource.upsert({
    where: { slug: "cynex" },
    update: {},
    create: {
      name: "Cynex",
      slug: "cynex",
      contactChannel: "internal",
      defaultWarrantyDays: 30,
      notes: "Nguồn tự cung cấp / vận hành nội bộ",
      status: "active",
    },
  });

  const spotify = await prisma.product.upsert({
    where: { slug: "spotify-premium" },
    update: {},
    create: {
      name: "Spotify Premium",
      slug: "spotify-premium",
      shortDescription: "Nghe nhạc không quảng cáo, chất lượng cao.",
      description: "Tài khoản Spotify Premium chính hãng, bảo hành đầy đủ.",
      status: "active",
      sortOrder: 1,
      categoryId: streaming.id,
    },
  });

  const sharedVariant = await prisma.productVariant.upsert({
    where: { slug: "spotify-premium-shared-1m" },
    update: {},
    create: {
      productId: spotify.id,
      name: "Spotify Premium - Acc dùng chung - 1 tháng",
      slug: "spotify-premium-shared-1m",
      price: 35000,
      costEstimate: 15000,
      durationDays: 30,
      fulfillmentType: "SHARED_ACCOUNT",
      defaultSourceId: cynexSource.id,
      warrantyDays: 30,
      estimatedDeliveryMinutes: 30,
      status: "active",
    },
  });

  await prisma.productVariant.upsert({
    where: { slug: "spotify-premium-upgrade-1m" },
    update: {},
    create: {
      productId: spotify.id,
      name: "Spotify Premium - Nâng chính chủ - 1 tháng",
      slug: "spotify-premium-upgrade-1m",
      price: 49000,
      costEstimate: 20000,
      durationDays: 30,
      fulfillmentType: "CUSTOMER_ACCOUNT_UPGRADE",
      defaultSourceId: cynexSource.id,
      warrantyDays: 30,
      estimatedDeliveryMinutes: 60,
      requiresCustomerInput: true,
      customerInputSchema: {
        fields: [{ name: "account_email", label: "Email tài khoản Spotify", type: "email", required: true }],
      },
      status: "active",
    },
  });

  const netflix = await prisma.product.upsert({
    where: { slug: "netflix-premium" },
    update: {},
    create: {
      name: "Netflix Premium",
      slug: "netflix-premium",
      shortDescription: "Xem phim 4K, nhiều profile.",
      description: "Netflix Premium profile riêng hoặc dùng chung.",
      status: "active",
      sortOrder: 2,
      categoryId: streaming.id,
    },
  });

  const netflixVariant = await prisma.productVariant.upsert({
    where: { slug: "netflix-shared-1m" },
    update: {},
    create: {
      productId: netflix.id,
      name: "Netflix Premium - Profile dùng chung - 1 tháng",
      slug: "netflix-shared-1m",
      price: 65000,
      costEstimate: 30000,
      durationDays: 30,
      fulfillmentType: "SHARED_ACCOUNT",
      defaultSourceId: cynexSource.id,
      warrantyDays: 7,
      estimatedDeliveryMinutes: 45,
      status: "active",
    },
  });

  const chatgpt = await prisma.product.upsert({
    where: { slug: "chatgpt-plus" },
    update: {},
    create: {
      name: "ChatGPT Plus",
      slug: "chatgpt-plus",
      shortDescription: "Truy cập GPT-4 và các tính năng Plus.",
      description: "Nâng cấp tài khoản OpenAI ChatGPT Plus.",
      status: "active",
      sortOrder: 3,
      categoryId: ai.id,
    },
  });

  const chatgptVariant = await prisma.productVariant.upsert({
    where: { slug: "chatgpt-plus-1m" },
    update: {},
    create: {
      productId: chatgpt.id,
      name: "ChatGPT Plus - 1 tháng",
      slug: "chatgpt-plus-1m",
      price: 350000,
      costEstimate: 280000,
      durationDays: 30,
      fulfillmentType: "LICENSE_KEY",
      defaultSourceId: cynexSource.id,
      warrantyDays: 30,
      estimatedDeliveryMinutes: 120,
      status: "active",
    },
  });

  // Demo inventory for fulfillment testing
  const encPw = encrypt("demo-password-123");
  const encKey = encrypt("DEMO-KEY-XXXX-YYYY");

  await prisma.inventoryAccount.upsert({
    where: { id: "seed-spotify-shared-demo" },
    update: {},
    create: {
      id: "seed-spotify-shared-demo",
      productVariantId: sharedVariant.id,
      sourceId: cynexSource.id,
      username: "spotify.shared.demo@cynex.local",
      passwordEncrypted: encPw,
      accountType: "shared",
      maxSlots: 5,
      usedSlots: 0,
      status: "available",
    },
  });

  await prisma.inventoryAccount.upsert({
    where: { id: "seed-netflix-shared-demo" },
    update: {},
    create: {
      id: "seed-netflix-shared-demo",
      productVariantId: netflixVariant.id,
      sourceId: cynexSource.id,
      username: "netflix.shared.demo@cynex.local",
      passwordEncrypted: encPw,
      accountType: "shared",
      maxSlots: 4,
      usedSlots: 1,
      status: "available",
    },
  });

  await prisma.inventoryKey.upsert({
    where: { id: "seed-chatgpt-key-demo" },
    update: {},
    create: {
      id: "seed-chatgpt-key-demo",
      productVariantId: chatgptVariant.id,
      sourceId: cynexSource.id,
      keyEncrypted: encKey,
      status: "available",
    },
  });

  console.log(
    "Seed complete: admin@cynex.local / admin12345, 3 products, Cynex source, demo inventory",
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
