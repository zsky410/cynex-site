export function buildListQuery(input: {
  page?: number;
  perPage?: number;
  sort?: string;
  order?: "ASC" | "DESC";
  filter?: Record<string, unknown>;
}) {
  return new URLSearchParams({
    page: String(input.page ?? 1),
    perPage: String(input.perPage ?? 25),
    sort: input.sort ?? "id",
    order: input.order ?? "DESC",
    filter: JSON.stringify(input.filter ?? {}),
  });
}

export function buildIdsQuery(ids: Array<string | number>) {
  return new URLSearchParams({ ids: JSON.stringify(ids) });
}
