// Parses the query convention used by the admin dataProvider:
//   ?page&perPage&sort&order&filter(JSON)&ids(JSON)
export interface ParsedListQuery {
  skip: number;
  take: number;
  orderBy: Record<string, "asc" | "desc">;
  filter: Record<string, unknown>;
  ids?: string[];
}

export function parseListQuery(q: Record<string, any>): ParsedListQuery {
  const page = Math.max(1, Number(q.page ?? 1));
  const perPage = Math.min(200, Math.max(1, Number(q.perPage ?? 25)));
  const sort = typeof q.sort === "string" && q.sort ? q.sort : "createdAt";
  const order = String(q.order ?? "DESC").toLowerCase() === "asc" ? "asc" : "desc";

  let filter: Record<string, unknown> = {};
  if (q.filter) {
    try {
      filter = JSON.parse(q.filter);
    } catch {
      filter = {};
    }
  }
  let ids: string[] | undefined;
  if (q.ids) {
    try {
      ids = JSON.parse(q.ids);
    } catch {
      ids = undefined;
    }
  }

  return {
    skip: (page - 1) * perPage,
    take: perPage,
    orderBy: { [sort]: order },
    filter,
    ids,
  };
}
