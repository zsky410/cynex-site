import assert from "node:assert/strict";
import test from "node:test";
import { getDashboardRecoveryAction } from "../src/dashboardRecovery";

test("missing token requests logout instead of reloading the page", () => {
  assert.equal(getDashboardRecoveryAction({ hasToken: false }), "logout");
});

test("401 auth failure requests logout instead of reloading the page", () => {
  assert.equal(getDashboardRecoveryAction({ hasToken: true, status: 401 }), "logout");
});

test("403 auth failure requests logout instead of reloading the page", () => {
  assert.equal(getDashboardRecoveryAction({ hasToken: true, status: 403 }), "logout");
});

test("non-auth failures stay on the dashboard", () => {
  assert.equal(getDashboardRecoveryAction({ hasToken: true, status: 500 }), "stay");
});
