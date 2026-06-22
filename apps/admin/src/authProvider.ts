import type { AuthProvider } from "react-admin";
import { API_URL } from "./config";
import {
  clearAuthStorage,
  getStoredIdentity,
  getStoredToken,
  setAuthStorage,
} from "./lib/auth-storage";

export const getToken = (): string | null => getStoredToken();

export const authProvider: AuthProvider = {
  async login({ username, password }) {
    const res = await fetch(`${API_URL}/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: username, password }),
    });
    if (!res.ok) throw new Error("Đăng nhập thất bại");
    const data = await res.json();
    setAuthStorage({ accessToken: data.accessToken, admin: data.admin ?? {} });
  },
  async logout() {
    clearAuthStorage();
  },
  async checkAuth() {
    if (!getToken()) throw new Error("Chưa đăng nhập");
  },
  async checkError(error) {
    if (error?.status === 401 || error?.status === 403) {
      clearAuthStorage();
      throw new Error("Phiên hết hạn");
    }
  },
  async getIdentity() {
    const a = getStoredIdentity<Record<string, unknown>>() ?? {};
    return {
      id: typeof a.id === "string" || typeof a.id === "number" ? a.id : "admin",
      fullName:
        typeof a.name === "string"
          ? a.name
          : typeof a.email === "string"
            ? a.email
            : "Admin",
    };
  },
  async getPermissions() {
    const identity = getStoredIdentity<Record<string, unknown>>();
    return identity?.role ?? "admin";
  },
};
