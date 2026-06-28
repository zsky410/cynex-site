import { after, test } from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { PrismaClient } from "@cynex/db";
import { FilesService, prepareFileForStorage } from "../src/files/files.service";

const prisma = new PrismaClient();
const files = new FilesService(prisma as any);

after(async () => {
  await prisma.$disconnect();
});

async function makeUser(prefix: string) {
  return prisma.user.create({
    data: {
      email: `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@test.com`,
      passwordHash: "x",
    },
  });
}

async function makeAdmin(prefix: string) {
  return prisma.admin.create({
    data: {
      email: `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e4)}@test.com`,
      passwordHash: "x",
    },
  });
}

test("user upload stores metadata on R2 and user/admin can read content", async () => {
  const user = await makeUser("file-user");
  const admin = await makeAdmin("file-admin");
  let fileId: string | undefined;
  let storageKey: string | undefined;

  try {
    const uploaded = await files.uploadForUser(user.id, {
      originalname: "proof.txt",
      mimetype: "text/plain",
      size: Buffer.byteLength("hello world"),
      buffer: Buffer.from("hello world"),
    });
    fileId = uploaded.id;

    const record = await prisma.fileObject.findUniqueOrThrow({ where: { id: fileId } });
    storageKey = record.storageKey;
    assert.equal(record.uploadedByUserId, user.id);
    assert.equal(record.storageDriver, "r2");
    assert.equal(record.storageBucket, process.env.R2_BUCKET);
    assert.equal(Boolean(record.publicUrl), Boolean(process.env.R2_PUBLIC_BASE_URL?.trim()));
    assert.equal(uploaded.storageDriver, "r2");

    const asUser = await files.getForUser(user.id, fileId);
    assert.equal(asUser.mimeType, "text/plain");
    assert.equal(asUser.body.toString("utf8"), "hello world");

    const asAdmin = await files.getForAdmin(fileId);
    assert.equal(asAdmin.body.toString("utf8"), "hello world");

    await assert.rejects(() => files.getForUser("someone-else", fileId!), /không tồn tại|tồn tại/i);
  } finally {
    if (storageKey) {
      await (files as any).deleteR2Object(storageKey).catch(() => undefined);
    }
    if (fileId) {
      await prisma.fileObject.delete({ where: { id: fileId } }).catch(() => undefined);
    }
    await prisma.admin.delete({ where: { id: admin.id } }).catch(() => undefined);
    await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
  }
});

test("rejects unsupported mime types", async () => {
  const user = await makeUser("file-bad-mime");
  try {
    await assert.rejects(
      () =>
        files.uploadForUser(user.id, {
          originalname: "archive.zip",
          mimetype: "application/zip",
          size: 3,
          buffer: Buffer.from("zip"),
        }),
      /hỗ trợ/i,
    );
  } finally {
    await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
  }
});

test("upload requires R2 config but does not need it at app boot", async () => {
  const user = await makeUser("file-missing-r2");
  const original = {
    R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET: process.env.R2_BUCKET,
    R2_ENDPOINT: process.env.R2_ENDPOINT,
    R2_ACCOUNT_ID: process.env.R2_ACCOUNT_ID,
  };

  try {
    process.env.R2_ACCESS_KEY_ID = "";
    process.env.R2_SECRET_ACCESS_KEY = "";
    process.env.R2_BUCKET = "";
    process.env.R2_ENDPOINT = "";
    process.env.R2_ACCOUNT_ID = "";

    await assert.rejects(
      () =>
        files.uploadForUser(user.id, {
          originalname: "proof.txt",
          mimetype: "text/plain",
          size: Buffer.byteLength("hello world"),
          buffer: Buffer.from("hello world"),
        }),
      /R2 chưa được cấu hình đầy đủ/i,
    );
  } finally {
    process.env.R2_ACCESS_KEY_ID = original.R2_ACCESS_KEY_ID;
    process.env.R2_SECRET_ACCESS_KEY = original.R2_SECRET_ACCESS_KEY;
    process.env.R2_BUCKET = original.R2_BUCKET;
    process.env.R2_ENDPOINT = original.R2_ENDPOINT;
    process.env.R2_ACCOUNT_ID = original.R2_ACCOUNT_ID;
    await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
  }
});

test("image uploads are resized and converted to a smaller webp object", async () => {
  const input = await sharp({
    create: {
      width: 2400,
      height: 1600,
      channels: 3,
      background: { r: 20, g: 120, b: 220 },
    },
  })
    .png()
    .toBuffer();

  const prepared = await prepareFileForStorage({
    originalname: "large-product.png",
    mimetype: "image/png",
    size: input.length,
    buffer: input,
  });

  assert.equal(prepared.mimetype, "image/webp");
  assert.equal(prepared.originalname, "large-product.webp");
  assert.ok(prepared.buffer.length < input.length);

  const metadata = await sharp(prepared.buffer).metadata();
  assert.equal(metadata.format, "webp");
  assert.ok((metadata.width ?? 0) <= 1600);
  assert.ok((metadata.height ?? 0) <= 1600);
});

test("admin file delete removes R2 object before deleting database record", async () => {
  const calls: string[] = [];
  const service = new FilesService({
    fileObject: {
      findFirst: async () => ({
        id: "file_1",
        storageDriver: "r2",
        storageKey: "admin/admin_1/2026-06-29/file.webp",
        uploadedByAdminId: "admin_1",
      }),
      delete: async () => {
        calls.push("db-delete");
      },
    },
    product: {
      count: async () => 0,
    },
    sourceOrder: {
      count: async () => 0,
    },
  } as any);

  (service as any).deleteR2Object = async (key: string) => {
    calls.push(`r2-delete:${key}`);
  };

  await service.deleteAdminFile("admin_1", "file_1");

  assert.deepEqual(calls, ["r2-delete:admin/admin_1/2026-06-29/file.webp", "db-delete"]);
});
