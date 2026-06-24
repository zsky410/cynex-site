// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deleteManyResources } from "./admin-api";

describe("admin-api bulk delete", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    localStorage.clear();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("collects succeeded ids when every delete request succeeds", async () => {
    vi.mocked(global.fetch).mockResolvedValue(
      new Response(JSON.stringify({ data: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await deleteManyResources("products", ["p1", "p2"]);

    expect(result).toEqual({
      succeededIds: ["p1", "p2"],
      failed: [],
    });
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("returns mixed success and failure results when some requests fail", async () => {
    vi.mocked(global.fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ data: {} }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "Không thể xóa" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }),
      );

    const result = await deleteManyResources("products", ["p1", "p2"]);

    expect(result).toEqual({
      succeededIds: ["p1"],
      failed: [
        {
          id: "p2",
          message: "Không thể xóa",
          status: 400,
          body: { message: "Không thể xóa" },
        },
      ],
    });
  });
});
