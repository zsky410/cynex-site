import test from "node:test";
import assert from "node:assert/strict";
import { BadRequestException } from "@nestjs/common";
import {
  assertValidCustomerInput,
  getConfiguredCustomerFields,
} from "../src/orders/customer-input";

test("getConfiguredCustomerFields keeps only named labeled fields", () => {
  assert.deepEqual(
    getConfiguredCustomerFields({
      fields: [
        { name: "account_email", label: "Email tai khoan", required: true },
        { name: "", label: "Ignored" },
        { name: "missing_label", label: "" },
      ],
    }),
    [{ name: "account_email", label: "Email tai khoan", required: true }],
  );
});

test("assertValidCustomerInput rejects missing required values", () => {
  assert.throws(
    () =>
      assertValidCustomerInput(
        {
          fields: [{ name: "account_email", label: "Email tai khoan", required: true }],
        },
        {},
      ),
    (error: unknown) =>
      error instanceof BadRequestException &&
      error.message === "Vui lòng nhập Email tai khoan",
  );
});

test("assertValidCustomerInput rejects unconfigured schema", () => {
  assert.throws(
    () => assertValidCustomerInput({ fields: [] }, { anything: "x" }),
    (error: unknown) =>
      error instanceof BadRequestException &&
      error.message === "Gói này chưa cấu hình thông tin khách cần nhập",
  );
});
