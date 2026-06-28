import { describe, expect, it } from "vitest";
import { buildProductPayload } from "./ProductFormFields";

describe("buildProductPayload", () => {
  it("includes categoryId in the admin payload when a category is selected", () => {
    const payload = buildProductPayload({
      name: "Spotify Premium",
      slug: "spotify-premium",
      shortDescription: "Nghe nhac",
      description: "Mo ta",
      status: "inactive",
      categoryId: "cat-ai-tools",
      image: {
        id: "file-image",
        fileName: "image.png",
        mimeType: "image/png",
        size: 1024,
        contentPath: "/files/file-image",
      },
      guideFiles: [{
        id: "file-guide",
        fileName: "guide.pdf",
        mimeType: "application/pdf",
        size: 2048,
        contentPath: "/files/file-guide",
      }],
    });

    expect(payload).toEqual({
      name: "Spotify Premium",
      slug: "spotify-premium",
      shortDescription: "Nghe nhac",
      description: "Mo ta",
      status: "inactive",
      categoryId: "cat-ai-tools",
      imageFileId: "file-image",
      guideFileIds: ["file-guide"],
    });
  });
});
