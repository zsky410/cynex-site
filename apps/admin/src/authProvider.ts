import type { AuthProvider } from "react-admin";
import { API_URL } from "./config";

const TOKEN_KEY = "cynex_admin_token";

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);

export const authProvider: AuthProvider = {
  async login({ username, password }) {
    const res = await fetch(`${API_URL}/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: username, password }),
    });
    if (!res.ok) throw new Error("Đăng nhập thất bại");
    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    localStorage.setItem("cynex_admin_identity", JSON.stringify(data.admin ?? {}));
  },
  async logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("cynex_admin_identity");
  },
  async checkAuth() {
    if (!getToken()) throw new Error("Chưa đăng nhập");
  },
  async checkError(error) {
    if (error?.status === 401 || error?.status === 403) {
      localStorage.removeItem(TOKEN_KEY);
      throw new Error("Phiên hết hạn");
    }
  },
  async getIdentity() {
    const raw = localStorage.getItem("cynex_admin_identity");
    const a = raw ? JSON.parse(raw) : {};
    return { id: a.id ?? "admin", fullName: a.name ?? a.email ?? "Admin" };
  },
  async getPermissions() {
    const raw = localStorage.getItem("cynex_admin_identity");
    return raw ? JSON.parse(raw).role ?? "admin" : "admin";
  },
};
