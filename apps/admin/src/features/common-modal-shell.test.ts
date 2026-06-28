import { describe, expect, it } from "vitest";
import fs from "node:fs";

const modalFiles = [
  "src/features/products/ProductModal.tsx",
  "src/features/variants/VariantModal.tsx",
  "src/features/categories/CategoryModal.tsx",
  "src/features/sources/SourceModal.tsx",
];

describe("admin modal form shell", () => {
  it("does not wrap modal forms in a nested transparent Card", () => {
    for (const file of modalFiles) {
      const source = fs.readFileSync(file, "utf8");
      expect(source).not.toContain("<Card bordered={false}");
      expect(source).not.toContain("styles={{ body: { padding: 0 } }}");
    }
  });
});
