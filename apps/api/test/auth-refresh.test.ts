import { after, test } from "node:test";
import assert from "node:assert/strict";
import * as argon2 from "argon2";
import { UnauthorizedException } from "@nestjs/common";
import { PrismaClient } from "@cynex/db";
import { AuthService } from "../src/auth/auth.service";

const prisma = new PrismaClient();

after(async () => {
  await prisma.$disconnect();
});

function authService() {
  const tokens = {
    issue: async (sub: string, type: "user" | "admin") => ({
      accessToken: `access-${sub}`,
      refreshToken: `refresh-${sub}-${type}`,
    }),
    verifyRefresh: async (token: string) => {
      const m = /^refresh-(.+)-(user|admin)$/.exec(token);
      if (!m) throw new Error("bad token");
      return { sub: m[1], type: m[2] as "user" | "admin" };
    },
  };
  return new AuthService(prisma as any, tokens as any, { enqueueEmail: async () => {} } as any, {
    get: () => "http://localhost:3000",
  } as any);
}

test("refresh returns a new token pair for an active user", async () => {
  const email = `refresh-${Date.now()}@test.com`;
  const user = await prisma.user.create({
    data: { email, passwordHash: await argon2.hash("password12345") },
  });
  const service = authService();
  try {
    const pair = await service.refresh(`refresh-${user.id}-user`);
    assert.equal(pair.accessToken, `access-${user.id}`);
    assert.ok(pair.refreshToken);
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
  }
});

test("changePassword updates hash when current password is correct", async () => {
  const email = `changepw-${Date.now()}@test.com`;
  const oldHash = await argon2.hash("oldpassword1");
  const user = await prisma.user.create({ data: { email, passwordHash: oldHash } });
  const service = authService();
  try {
    await service.changePassword(user.id, { currentPassword: "oldpassword1", newPassword: "newpassword2" });
    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    assert.notEqual(updated.passwordHash, oldHash);
    assert.equal(await argon2.verify(updated.passwordHash, "newpassword2"), true);
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
  }
});

test("changePassword rejects wrong current password", async () => {
  const email = `changepw-bad-${Date.now()}@test.com`;
  const user = await prisma.user.create({
    data: { email, passwordHash: await argon2.hash("oldpassword1") },
  });
  const service = authService();
  try {
    await assert.rejects(
      () => service.changePassword(user.id, { currentPassword: "wrong", newPassword: "newpassword2" }),
      UnauthorizedException,
    );
  } finally {
    await prisma.user.delete({ where: { id: user.id } });
  }
});
