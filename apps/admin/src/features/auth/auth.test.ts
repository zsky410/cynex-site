// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import {
  clearAuthStorage,
  getStoredIdentity,
  getStoredToken,
  setAuthStorage,
} from "../../lib/auth-storage";

describe("auth-storage", () => {
  beforeEach(() => localStorage.clear());

  it("stores token and identity under the legacy keys", () => {
    setAuthStorage({
      accessToken: "token-123",
      admin: { id: "admin-1", email: "admin@example.com", role: "admin" },
    });

    expect(getStoredToken()).toBe("token-123");
    expect(getStoredIdentity()).toEqual({
      id: "admin-1",
      email: "admin@example.com",
      role: "admin",
    });
  });

  it("clears the stored auth state", () => {
    setAuthStorage({ accessToken: "token-123", admin: { id: "a" } });
    clearAuthStorage();
    expect(getStoredToken()).toBeNull();
    expect(getStoredIdentity()).toBeNull();
  });
});
