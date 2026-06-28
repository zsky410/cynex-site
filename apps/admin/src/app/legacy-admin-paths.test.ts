import { describe, expect, it } from "vitest";
import {
  buildLegacyAdminRedirectTarget,
  resolveLegacyAdminPath,
} from "./legacy-admin-paths";

describe("resolveLegacyAdminPath", () => {
  it("redirects dashboard and root to the shell dashboard", () => {
    expect(resolveLegacyAdminPath("/")).toBe("/shell/dashboard");
    expect(resolveLegacyAdminPath("/dashboard")).toBe("/shell/dashboard");
  });

  it("redirects list and create pages for editable resources", () => {
    expect(resolveLegacyAdminPath("/products")).toBe("/shell/products");
    expect(resolveLegacyAdminPath("/products/create")).toBe("/shell/products/new");
    expect(resolveLegacyAdminPath("/product-variants/123")).toBe("/shell/products");
    expect(resolveLegacyAdminPath("/inventory-keys/create")).toBe("/shell/inventory/keys/new");
  });

  it("redirects show and edit routes based on resource capabilities", () => {
    expect(resolveLegacyAdminPath("/orders/ord_1/show")).toBe("/shell/orders/ord_1");
    expect(resolveLegacyAdminPath("/orders/ord_1")).toBe("/shell/orders/ord_1");
    expect(resolveLegacyAdminPath("/users/user_1")).toBe("/shell/users/user_1/edit");
    expect(resolveLegacyAdminPath("/users/user_1/show")).toBe("/shell/users/user_1");
    expect(resolveLegacyAdminPath("/warranty-cases/case_1")).toBe("/shell/warranty/case_1/edit");
    expect(resolveLegacyAdminPath("/warranty-cases/case_1/show")).toBe("/shell/warranty/case_1");
    expect(resolveLegacyAdminPath("/email-logs/log_1/show")).toBe("/shell/email-logs/log_1");
  });

  it("supports secondary legacy aliases and ignores unknown paths", () => {
    expect(resolveLegacyAdminPath("/variants/create")).toBe("/shell/products");
    expect(resolveLegacyAdminPath("/sources")).toBe("/shell/sources");
    expect(resolveLegacyAdminPath("/unknown/path")).toBeNull();
  });

  it("preserves search params and hashes when building redirect targets", () => {
    expect(
      buildLegacyAdminRedirectTarget(
        "/orders/order_1/show",
        "?tab=fulfillment",
        "#history",
      ),
    ).toBe("/shell/orders/order_1?tab=fulfillment#history");
  });
});
