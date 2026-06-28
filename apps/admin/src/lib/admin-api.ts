import { API_URL } from "../config";
import { clearAuthStorage, getStoredToken } from "./auth-storage";
import { HttpError } from "./http-error";
import { buildIdsQuery, buildListQuery } from "./query-string";

type ListParams = {
  page?: number;
  perPage?: number;
  sort?: string;
  order?: "ASC" | "DESC";
  filter?: Record<string, unknown>;
};

export async function adminFetch<T>(path: string, init: RequestInit = {}) {
  const token = getStoredToken();
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });

  const body = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) clearAuthStorage();
    throw new HttpError(
      typeof body === "object" && body && "message" in body && typeof body.message === "string"
        ? body.message
        : response.statusText,
      response.status,
      body,
    );
  }

  return body as T;
}

export function listResource<T>(resource: string, params: ListParams) {
  const query = buildListQuery(params).toString();
  return adminFetch<{ data: T[]; total: number }>(`/admin/${resource}?${query}`);
}

export function getManyResources<T>(resource: string, ids: Array<string | number>) {
  const query = buildIdsQuery(ids).toString();
  return adminFetch<{ data: T[] }>(`/admin/${resource}?${query}`);
}

export function getManyReferenceResource<T>(
  resource: string,
  params: ListParams & { target: string; id: string | number },
) {
  const query = buildListQuery({
    page: params.page,
    perPage: params.perPage,
    sort: params.sort,
    order: params.order,
    filter: { ...params.filter, [params.target]: params.id },
  }).toString();

  return adminFetch<{ data: T[]; total: number }>(`/admin/${resource}?${query}`);
}

export function getResource<T>(resource: string, id: string | number) {
  return adminFetch<{ data: T }>(`/admin/${resource}/${id}`);
}

export function createResource<T>(resource: string, data: Record<string, unknown>) {
  return adminFetch<{ data: T }>(`/admin/${resource}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateResource<T>(
  resource: string,
  id: string | number,
  data: Record<string, unknown>,
) {
  return adminFetch<{ data: T }>(`/admin/${resource}/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteResource<T>(resource: string, id: string | number) {
  return adminFetch<{ data: T }>(`/admin/${resource}/${id}`, {
    method: "DELETE",
  });
}

export function uploadAdminFile(file: File) {
  const body = new FormData();
  body.append("file", file);
  return adminFetch<{
    id: string;
    fileName: string;
    mimeType: string;
    size: number;
    storageDriver: string;
    publicUrl?: string;
    contentPath: string;
  }>("/admin/files/upload", {
    method: "POST",
    body,
  });
}

export function deleteAdminFile(fileId: string) {
  return adminFetch<{ id: string }>(`/admin/files/${fileId}`, {
    method: "DELETE",
  });
}

export async function deleteManyResources(resource: string, ids: Array<string | number>) {
  const results = await Promise.allSettled(ids.map((id) => deleteResource(resource, id)));

  return results.reduce<{
    succeededIds: Array<string | number>;
    failed: Array<{ id: string | number; message: string; status?: number; body?: unknown }>;
  }>(
    (accumulator, result, index) => {
      const id = ids[index];
      if (result.status === "fulfilled") {
        accumulator.succeededIds.push(id);
        return accumulator;
      }

      accumulator.failed.push({
        id,
        message: result.reason instanceof Error ? result.reason.message : "Không thể xóa bản ghi",
        status: result.reason instanceof HttpError ? result.reason.status : undefined,
        body: result.reason instanceof HttpError ? result.reason.body : undefined,
      });
      return accumulator;
    },
    { succeededIds: [], failed: [] },
  );
}
