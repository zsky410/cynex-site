import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// AES-256-GCM secret-at-rest helper (PRD 15.3). The key is read lazily from
// ENCRYPTION_KEY (base64-encoded 32 bytes) so importing this module never throws
// at load time in environments that don't touch secrets.

const IV_LEN = 12; // GCM standard nonce length
const TAG_LEN = 16;

function loadKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY is not set");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) {
    throw new Error(`ENCRYPTION_KEY must decode to 32 bytes, got ${key.length}`);
  }
  return key;
}

// Returns base64( iv | authTag | ciphertext ).
export function encrypt(plaintext: string): string {
  const key = loadKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ciphertext]).toString("base64");
}

export function decrypt(payload: string): string {
  const key = loadKey();
  const buf = Buffer.from(payload, "base64");
  if (buf.length < IV_LEN + TAG_LEN) throw new Error("ciphertext too short");
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + TAG_LEN);
  const ciphertext = buf.subarray(IV_LEN + TAG_LEN);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

// Convenience for nullable DB columns.
export function encryptNullable(v: string | null | undefined): string | null {
  return v == null || v === "" ? null : encrypt(v);
}
export function decryptNullable(v: string | null | undefined): string | null {
  return v == null || v === "" ? null : decrypt(v);
}
