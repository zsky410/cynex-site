const TOKEN_KEY = "cynex_admin_token";
const IDENTITY_KEY = "cynex_admin_identity";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredIdentity<T = Record<string, unknown>>() {
  const raw = localStorage.getItem(IDENTITY_KEY);
  return raw ? (JSON.parse(raw) as T) : null;
}

export function setAuthStorage(data: {
  accessToken: string;
  admin: Record<string, unknown>;
}) {
  localStorage.setItem(TOKEN_KEY, data.accessToken);
  localStorage.setItem(IDENTITY_KEY, JSON.stringify(data.admin ?? {}));
}

export function clearAuthStorage() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(IDENTITY_KEY);
}
