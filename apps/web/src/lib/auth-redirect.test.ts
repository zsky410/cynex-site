import test from "node:test";
import assert from "node:assert/strict";
import { resolvePostAuthRedirect } from "./auth-redirect";

test("resolvePostAuthRedirect falls back when next is empty or invalid", () => {
  assert.equal(resolvePostAuthRedirect(null, "/orders"), "/orders");
  assert.equal(resolvePostAuthRedirect("", "/orders"), "/orders");
  assert.equal(resolvePostAuthRedirect("https://evil.example", "/orders"), "/orders");
  assert.equal(resolvePostAuthRedirect("//evil.example", "/orders"), "/orders");
  assert.equal(resolvePostAuthRedirect("orders", "/orders"), "/orders");
});

test("resolvePostAuthRedirect accepts internal absolute paths", () => {
  assert.equal(resolvePostAuthRedirect("/wallet", "/orders"), "/wallet");
  assert.equal(resolvePostAuthRedirect("/checkout/ABC123", "/orders"), "/checkout/ABC123");
});
