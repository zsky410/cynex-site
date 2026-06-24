import { describe, expect, it } from "vitest";
import { createSlug, deriveNextSlugState } from "./slug";

describe("slug helpers", () => {
  it("creates an ascii slug from vietnamese text", () => {
    expect(createSlug("Gói Nâng cấp Chính Chủ 12 Tháng")).toBe("goi-nang-cap-chinh-chu-12-thang");
  });

  it("drops repeated separators and trims edges", () => {
    expect(createSlug("  Product --- Name / Demo  ")).toBe("product-name-demo");
  });

  it("auto updates slug while it has not been manually overridden", () => {
    expect(
      deriveNextSlugState({
        name: "Netflix Premium",
        currentSlug: "",
        hasManualOverride: false,
      }),
    ).toEqual({
      slug: "netflix-premium",
      hasManualOverride: false,
    });
  });

  it("stops auto updating after the user manually edits slug", () => {
    expect(
      deriveNextSlugState({
        name: "Netflix Premium",
        currentSlug: "custom-slug",
        hasManualOverride: true,
      }),
    ).toEqual({
      slug: "custom-slug",
      hasManualOverride: true,
    });
  });

  it("clears manual override when slug becomes empty again", () => {
    expect(
      deriveNextSlugState({
        name: "Spotify Family",
        currentSlug: "",
        hasManualOverride: true,
      }),
    ).toEqual({
      slug: "spotify-family",
      hasManualOverride: false,
    });
  });
});
