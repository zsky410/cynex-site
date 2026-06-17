import { after, test } from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@cynex/db";
import { FilesService } from "../src/files/files.service";

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

test("user upload creates metadata and user/admin can read local fallback content", async () => {
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
    assert.equal(record.storageDriver, "local");

    const asUser = await files.getForUser(user.id, fileId);
    assert.equal(asUser.mimeType, "text/plain");
    assert.equal(asUser.body.toString("utf8"), "hello world");

    const asAdmin = await files.getForAdmin(fileId);
    assert.equal(asAdmin.body.toString("utf8"), "hello world");

    await assert.rejects(() => files.getForUser("someone-else", fileId!), /không tồn tại|tồn tại/i);
  } finally {
    if (fileId) {
      await prisma.fileObject.delete({ where: { id: fileId } }).catch(() => undefined);
    }
    if (storageKey) {
      await files.removeLocalFile(storageKey);
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
