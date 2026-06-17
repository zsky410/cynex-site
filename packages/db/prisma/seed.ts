import { config as loadDotenv } from "dotenv";
import { resolve } from "node:path";
import * as argon2 from "argon2";
import { PrismaClient } from "@prisma/client";

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

  const category = await prisma.category.upsert({
    where: { slug: "streaming" },
    update: {},
    create: { name: "Streaming", slug: "streaming", sortOrder: 1 },
  });

  const product = await prisma.product.upsert({
    where: { slug: "spotify-premium" },
    update: {},
    create: {
      name: "Spotify Premium",
      slug: "spotify-premium",
      shortDescription: "Nghe nhạc không quảng cáo, chất lượng cao.",
      description: "Tài khoản Spotify Premium chính hãng, bảo hành đầy đủ.",
      status: "active",
      sortOrder: 1,
      categoryId: category.id,
    },
  });

  await prisma.productVariant.upsert({
    where: { slug: "spotify-premium-shared-1m" },
    update: {},
    create: {
      productId: product.id,
      name: "Spotify Premium - Acc dùng chung - 1 tháng",
      slug: "spotify-premium-shared-1m",
      price: 35000,
      costEstimate: 15000,
      durationDays: 30,
      fulfillmentType: "SHARED_ACCOUNT",
      warrantyDays: 30,
      estimatedDeliveryMinutes: 30,
      status: "active",
    },
  });

  await prisma.productVariant.upsert({
    where: { slug: "spotify-premium-upgrade-1m" },
    update: {},
    create: {
      productId: product.id,
      name: "Spotify Premium - Nâng chính chủ - 1 tháng",
      slug: "spotify-premium-upgrade-1m",
      price: 49000,
      costEstimate: 20000,
      durationDays: 30,
      fulfillmentType: "CUSTOMER_ACCOUNT_UPGRADE",
      warrantyDays: 30,
      estimatedDeliveryMinutes: 60,
      requiresCustomerInput: true,
      customerInputSchema: {
        fields: [
          { name: "account_email", label: "Email tài khoản Spotify", type: "email", required: true },
        ],
      },
      status: "active",
    },
  });

  console.log("Seed complete: super-admin (admin@cynex.local / admin12345), 1 product, 2 variants");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
