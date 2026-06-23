import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { resourceConfigList } from "../lib/resource-config";

const routerSource = readFileSync(resolve(__dirname, "router.tsx"), "utf8");

describe("admin router coverage", () => {
  it("contains an explicit shell list route for every configured resource", () => {
    for (const config of resourceConfigList) {
      const relativeShellPath = config.shellPath.replace(/^\/shell\//, "");
      expect(routerSource).toContain(`path: "${relativeShellPath}"`);
    }
  });

  it("contains expected create, edit, and show routes based on resource capabilities", () => {
    const expectations = [
      { path: 'path: "products/new"' },
      { path: 'path: "products/:productId/edit"' },
      { path: 'path: "variants/new"' },
      { path: 'path: "variants/:variantId/edit"' },
      { path: 'path: "orders/:orderId"' },
      { path: 'path: "users/:userId"' },
      { path: 'path: "users/:userId/edit"' },
      { path: 'path: "sources/new"' },
      { path: 'path: "sources/:sourceId/edit"' },
      { path: 'path: "source-orders/new"' },
      { path: 'path: "source-orders/:sourceOrderId/edit"' },
      { path: 'path: "inventory/accounts/new"' },
      { path: 'path: "inventory/accounts/:accountId/edit"' },
      { path: 'path: "inventory/keys/new"' },
      { path: 'path: "inventory/keys/:keyId/edit"' },
      { path: 'path: "warranty/:warrantyId"' },
      { path: 'path: "warranty/:warrantyId/edit"' },
      { path: 'path: "email-logs/:emailLogId"' },
      { path: 'path: "audit-logs/:auditLogId"' },
    ];

    for (const expectation of expectations) {
      expect(routerSource).toContain(expectation.path);
    }
  });
});
