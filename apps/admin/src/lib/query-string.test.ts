import { describe, expect, it } from "vitest";
import { buildIdsQuery, buildListQuery } from "./query-string";

describe("query-string", () => {
  it("builds the legacy list query shape", () => {
    expect(
      buildListQuery({
        page: 2,
        perPage: 50,
        sort: "createdAt",
        order: "DESC",
        filter: { paymentStatus: "paid" },
      }).toString(),
    ).toBe(
      "page=2&perPage=50&sort=createdAt&order=DESC&filter=%7B%22paymentStatus%22%3A%22paid%22%7D",
    );
  });

  it("builds ids query using JSON encoding", () => {
    expect(buildIdsQuery([1, 2, 3]).toString()).toBe("ids=%5B1%2C2%2C3%5D");
  });
});
