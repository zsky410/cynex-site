import { describe, expect, it } from "vitest";
import { fulfillmentOptions } from "./VariantFormFields";

describe("VariantFormFields", () => {
  it("exposes only supported variant presentation options in admin", () => {
    expect(fulfillmentOptions).toEqual([
      { value: "CUSTOMER_ACCOUNT_UPGRADE", label: "Nâng cấp chính chủ" },
      { value: "DEDICATED_ACCOUNT", label: "Tài khoản riêng" },
      { value: "SHARED_ACCOUNT", label: "Tài khoản dùng chung" },
      { value: "LICENSE_KEY", label: "Key/License" },
    ]);
  });
});
