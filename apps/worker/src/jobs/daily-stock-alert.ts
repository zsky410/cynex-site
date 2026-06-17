import { prisma } from "@cynex/db";
import { ALERT_JOB } from "@cynex/shared";
import { registerHandler } from "../handlers";

registerHandler(ALERT_JOB.dailyStockAlert, async (job) => {
  const threshold =
    Number((job.data as { lowStockThreshold?: number } | undefined)?.lowStockThreshold) || 3;

  const [accounts, keys] = await Promise.all([
    prisma.inventoryAccount.groupBy({
      by: ["productVariantId"],
      where: { status: "available" },
      _count: { _all: true },
    }),
    prisma.inventoryKey.groupBy({
      by: ["productVariantId"],
      where: { status: "available" },
      _count: { _all: true },
    }),
  ]);

  const counts = new Map<
    string,
    { accountsAvailable: number; keysAvailable: number }
  >();
  for (const row of accounts) {
    counts.set(row.productVariantId, {
      accountsAvailable: row._count._all,
      keysAvailable: 0,
    });
  }
  for (const row of keys) {
    const current = counts.get(row.productVariantId) ?? {
      accountsAvailable: 0,
      keysAvailable: 0,
    };
    current.keysAvailable = row._count._all;
    counts.set(row.productVariantId, current);
  }

  const variants = await prisma.productVariant.findMany({
    where: {
      id: { in: Array.from(counts.keys()) },
    },
    select: {
      id: true,
      name: true,
      product: { select: { name: true } },
    },
  });

  const lowStock = variants
    .map((variant) => {
      const count = counts.get(variant.id) ?? {
        accountsAvailable: 0,
        keysAvailable: 0,
      };
      return {
        variantId: variant.id,
        label: `${variant.product.name} / ${variant.name}`,
        accountsAvailable: count.accountsAvailable,
        keysAvailable: count.keysAvailable,
        totalAvailable: count.accountsAvailable + count.keysAvailable,
      };
    })
    .filter((row) => row.totalAvailable <= threshold)
    .sort((a, b) => a.totalAvailable - b.totalAvailable)
    .slice(0, 20);

  console.log(
    `[alerts] low-stock threshold=${threshold} variants=${JSON.stringify(lowStock)}`,
  );
});
