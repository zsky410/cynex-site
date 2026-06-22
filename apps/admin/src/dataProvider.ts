import type { DataProvider } from "react-admin";
import { API_URL } from "./config";
import { getToken } from "./authProvider";
import { buildIdsQuery, buildListQuery } from "./lib/query-string";

// Custom provider speaking a small, consistent contract with the NestJS admin API:
//   list:   GET    /admin/<resource>?page&perPage&sort&order&filter  -> { data, total }
//   one:    GET    /admin/<resource>/:id                             -> { data }
//   create: POST   /admin/<resource>                                 -> { data }
//   update: PATCH  /admin/<resource>/:id                             -> { data }
//   delete: DELETE /admin/<resource>/:id                             -> { data }

async function http(path: string, init: RequestInit = {}): Promise<any> {
  const token = getToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err: any = new Error(body.message ?? res.statusText);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return res.status === 204 ? {} : res.json();
}

export const dataProvider: DataProvider = {
  async getList(resource, params) {
    const { page = 1, perPage = 25 } = params.pagination ?? {};
    const { field = "id", order = "DESC" } = params.sort ?? {};
    const query = buildListQuery({ page, perPage, sort: field, order, filter: params.filter ?? {} });
    const json = await http(`/admin/${resource}?${query.toString()}`);
    return { data: json.data, total: json.total ?? json.data.length };
  },
  async getOne(resource, params) {
    const json = await http(`/admin/${resource}/${params.id}`);
    return { data: json.data };
  },
  async getMany(resource, params) {
    const query = buildIdsQuery(params.ids);
    const json = await http(`/admin/${resource}?${query.toString()}`);
    return { data: json.data };
  },
  async getManyReference(resource, params) {
    const { page = 1, perPage = 25 } = params.pagination ?? {};
    const { field = "id", order = "DESC" } = params.sort ?? {};
    const query = buildListQuery({
      page,
      perPage,
      sort: field,
      order,
      filter: { ...params.filter, [params.target]: params.id },
    });
    const json = await http(`/admin/${resource}?${query.toString()}`);
    return { data: json.data, total: json.total ?? json.data.length };
  },
  async create(resource, params) {
    const json = await http(`/admin/${resource}`, {
      method: "POST",
      body: JSON.stringify(params.data),
    });
    return { data: json.data };
  },
  async update(resource, params) {
    const json = await http(`/admin/${resource}/${params.id}`, {
      method: "PATCH",
      body: JSON.stringify(params.data),
    });
    return { data: json.data };
  },
  async updateMany(resource, params) {
    await Promise.all(
      params.ids.map((id) =>
        http(`/admin/${resource}/${id}`, {
          method: "PATCH",
          body: JSON.stringify(params.data),
        }),
      ),
    );
    return { data: params.ids };
  },
  async delete(resource, params) {
    const json = await http(`/admin/${resource}/${params.id}`, { method: "DELETE" });
    return { data: json.data ?? params.previousData };
  },
  async deleteMany(resource, params) {
    await Promise.all(
      params.ids.map((id) => http(`/admin/${resource}/${id}`, { method: "DELETE" })),
    );
    return { data: params.ids };
  },
};
