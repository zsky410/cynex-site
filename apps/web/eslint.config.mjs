import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import shared from "@cynex/config/eslint";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  { ignores: ["next-env.d.ts"] },
  ...compat.extends("next/core-web-vitals"),
  ...shared,
];
