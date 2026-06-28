import { describe, expect, it } from "vitest";
import fs from "node:fs";

describe("AdminFileUploadField source contract", () => {
  const source = fs.readFileSync("src/components/files/AdminFileUploadField.tsx", "utf8");

  it("uses a hidden file input triggered by the custom upload button", () => {
    expect(source).toContain("inputRef.current?.click()");
    expect(source).toContain("hidden");
    expect(source).toContain("Chọn và tải tệp");
  });

  it("calls the admin file delete API when files are removed or replaced", () => {
    expect(source).toContain("deleteAdminFile");
    expect(source).toContain("Đã xóa tệp khỏi R2");
    expect(source).toContain("Promise.allSettled");
  });
});
