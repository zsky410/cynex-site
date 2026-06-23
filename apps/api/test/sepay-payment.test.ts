import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PaymentProvider as PrismaPaymentProvider } from "@cynex/db";
import { PaymentMethod, PaymentProvider } from "@cynex/shared";

test("shared enums expose sepay provider", () => {
  assert.equal(PaymentProvider.sepay, "sepay");
  assert.equal(PaymentMethod.sepay, "sepay");
  assert.deepEqual(PaymentProvider, PrismaPaymentProvider);
  assert.equal(PaymentMethod.sepay, PrismaPaymentProvider.sepay);

  const migrationSql = readFileSync(
    resolve(import.meta.dirname, "../../../packages/db/prisma/migrations/20260617091437_init/migration.sql"),
    "utf8",
  );

  assert.match(
    migrationSql,
    /CREATE TYPE "PaymentProvider" AS ENUM \('payos', 'sepay', 'wallet', 'manual'\);/,
  );
});
