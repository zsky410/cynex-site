import { describe, expect, it } from "vitest";
import { getDisplayLabel } from "./display-labels";

describe("getDisplayLabel", () => {
  it("maps known backend status and reason codes to Vietnamese labels", () => {
    expect(getDisplayLabel("active")).toBe("Hoạt động");
    expect(getDisplayLabel("out_of_stock")).toBe("Hết hàng");
    expect(getDisplayLabel("waiting_customer")).toBe("Chờ khách hàng");
    expect(getDisplayLabel("cannot_login")).toBe("Không thể đăng nhập");
  });

  it("maps fulfillment and supply codes to Vietnamese labels", () => {
    expect(getDisplayLabel("DEDICATED_ACCOUNT")).toBe("Tài khoản riêng");
    expect(getDisplayLabel("SHARED_ACCOUNT")).toBe("Tài khoản dùng chung");
    expect(getDisplayLabel("source_delivered")).toBe("Nguồn đã giao");
    expect(getDisplayLabel("internal")).toBe("Nội bộ");
  });

  it("maps audit and inventory codes to Vietnamese labels", () => {
    expect(getDisplayLabel("ADMIN_VIEW_SECRET")).toBe("Admin xem secret");
    expect(getDisplayLabel("assigned")).toBe("Đã gán");
    expect(getDisplayLabel("shared")).toBe("Dùng chung");
  });

  it("falls back to the original value when no mapping exists", () => {
    expect(getDisplayLabel("custom_code")).toBe("custom_code");
    expect(getDisplayLabel(undefined)).toBe("-");
  });
});
