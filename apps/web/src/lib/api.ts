import { API_BASE } from "./config";

const TOKEN_KEY = "cynex_token";
const REFRESH_KEY = "cynex_refresh_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_KEY, token);
}

export function setSession(accessToken: string, refreshToken?: string): void {
  setToken(accessToken);
  if (refreshToken) setRefreshToken(refreshToken);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) {
    clearToken();
    return null;
  }
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  if (!res.ok) {
    clearToken();
    return null;
  }
  const body = await res.json();
  setSession(body.accessToken, body.refreshToken);
  return body.accessToken as string;
}

async function fetchWithAuth(path: string, init: RequestInit, retried = false): Promise<Response> {
  const token = getToken();
  const isFormData = typeof FormData !== "undefined" && init.body instanceof FormData;
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (res.status === 401 && getRefreshToken() && !retried) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }
    const next = await refreshPromise;
    if (next) return fetchWithAuth(path, init, true);
  }
  return res;
}

// Client-side authenticated fetch.
export async function apiFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetchWithAuth(path, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.message ?? res.statusText);
  }
  return res.status === 204 ? (undefined as T) : res.json();
}

// Server-side public fetch (no auth, no cache).
export async function publicFetch<T = any>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}`);
  return res.json();
}

export async function apiUploadFile(file: File): Promise<{
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  storageDriver: string;
  publicUrl?: string;
  contentPath: string;
}> {
  const body = new FormData();
  body.append("file", file);
  return apiFetch("/files/upload", {
    method: "POST",
    body,
  });
}
