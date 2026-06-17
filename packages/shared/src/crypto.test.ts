import { test } from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { encrypt, decrypt, encryptNullable, decryptNullable } from "./crypto";

// crypto.ts reads ENCRYPTION_KEY lazily at call time, so setting it here (before
// any test runs) is sufficient even though the import is hoisted.
process.env.ENCRYPTION_KEY = randomBytes(32).toString("base64");

test("encrypt/decrypt round-trips", () => {
  const secret = "P@ssw0rd! với tiếng việt 🔐";
  const enc = encrypt(secret);
  assert.notEqual(enc, secret);
  assert.equal(decrypt(enc), secret);
});

test("each encryption uses a fresh nonce", () => {
  const a = encrypt("same");
  const b = encrypt("same");
  assert.notEqual(a, b, "ciphertexts must differ due to random IV");
  assert.equal(decrypt(a), decrypt(b));
});

test("tampered ciphertext fails authentication", () => {
  const enc = encrypt("tamper me");
  const buf = Buffer.from(enc, "base64");
  buf[buf.length - 1] ^= 0xff; // flip a ciphertext byte
  assert.throws(() => decrypt(buf.toString("base64")));
});

test("nullable helpers pass through empty values", () => {
  assert.equal(encryptNullable(null), null);
  assert.equal(encryptNullable(""), null);
  assert.equal(decryptNullable(null), null);
  const enc = encryptNullable("x");
  assert.equal(decryptNullable(enc), "x");
});
