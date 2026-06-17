import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { existsSync } from "node:fs";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";

type UploadableFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

type StoredFile = {
  body: Buffer;
  fileName: string;
  mimeType: string;
};

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
  "text/plain",
]);

@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaService) {}

  async uploadForUser(userId: string, file: UploadableFile | undefined) {
    return this.upload("user", userId, file);
  }

  async uploadForAdmin(adminId: string, file: UploadableFile | undefined) {
    return this.upload("admin", adminId, file);
  }

  async getForUser(userId: string, fileId: string): Promise<StoredFile> {
    const file = await this.prisma.fileObject.findFirst({
      where: {
        id: fileId,
        uploadedByUserId: userId,
      },
    });
    if (!file) throw new NotFoundException("Tệp không tồn tại");
    const body = await this.loadBody(file.storageDriver, file.storageKey);
    return { body, fileName: file.fileName, mimeType: file.mimeType };
  }

  async getForAdmin(fileId: string): Promise<StoredFile> {
    const file = await this.prisma.fileObject.findUnique({
      where: { id: fileId },
    });
    if (!file) throw new NotFoundException("Tệp không tồn tại");
    const body = await this.loadBody(file.storageDriver, file.storageKey);
    return { body, fileName: file.fileName, mimeType: file.mimeType };
  }

  async removeLocalFile(storageKey: string) {
    if (!storageKey) return;
    await unlink(this.localFilePath(storageKey)).catch(() => undefined);
  }

  private async upload(actorType: "user" | "admin", actorId: string, file: UploadableFile | undefined) {
    validateUpload(file);
    const ext = path.extname(file.originalname).toLowerCase();
    const storageKey = `${actorType}/${actorId}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${ext}`;
    const driver = r2Enabled() ? "r2" : "local";
    let publicUrl: string | undefined;

    if (driver === "r2") {
      const client = r2Client();
      await client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: storageKey,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
      const base = (process.env.R2_PUBLIC_BASE_URL ?? "").trim();
      publicUrl = base ? `${base.replace(/\/$/, "")}/${storageKey}` : undefined;
    } else {
      const target = this.localFilePath(storageKey);
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, file.buffer);
    }

    const created = await this.prisma.fileObject.create({
      data: {
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        storageDriver: driver,
        storageBucket: driver === "r2" ? process.env.R2_BUCKET : null,
        storageKey,
        publicUrl,
        uploadedByUserId: actorType === "user" ? actorId : null,
        uploadedByAdminId: actorType === "admin" ? actorId : null,
      },
    });

    const contentPath =
      actorType === "admin"
        ? `/admin/files/${created.id}/content`
        : `/files/${created.id}/content`;

    return {
      id: created.id,
      fileName: created.fileName,
      mimeType: created.mimeType,
      size: created.size,
      storageDriver: created.storageDriver,
      publicUrl: created.publicUrl,
      contentPath,
    };
  }

  private async loadBody(driver: string, storageKey: string): Promise<Buffer> {
    if (driver === "r2") {
      const client = r2Client();
      const object = await client.send(
        new GetObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: storageKey,
        }),
      );
      const bytes = await object.Body?.transformToByteArray();
      if (!bytes) throw new NotFoundException("Không thể tải tệp");
      return Buffer.from(bytes);
    }
    return readFile(this.localFilePath(storageKey));
  }

  private localFilePath(storageKey: string): string {
    return path.join(repoRoot(), ".data", "uploads", storageKey);
  }
}

function validateUpload(file: UploadableFile | undefined): asserts file is UploadableFile {
  if (!file) {
    throw new BadRequestException("Thiếu tệp tải lên");
  }
  if (!file.originalname || !file.buffer?.length) {
    throw new BadRequestException("Tệp không hợp lệ");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new BadRequestException("Tệp vượt quá giới hạn 10MB");
  }
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new BadRequestException("Định dạng tệp chưa được hỗ trợ");
  }
}

function r2Enabled(): boolean {
  return Boolean(
    process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET &&
      (process.env.R2_ENDPOINT || process.env.R2_ACCOUNT_ID),
  );
}

let _r2Client: S3Client | null = null;
function r2Client(): S3Client {
  if (_r2Client) return _r2Client;
  const endpoint =
    process.env.R2_ENDPOINT ||
    `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  _r2Client = new S3Client({
    region: "auto",
    endpoint,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    },
  });
  return _r2Client;
}

function repoRoot(): string {
  let current = process.cwd();
  for (;;) {
    if (current === path.dirname(current)) {
      return process.cwd();
    }
    if (existsAt(current, "pnpm-workspace.yaml")) {
      return current;
    }
    current = path.dirname(current);
  }
}

function existsAt(dir: string, fileName: string): boolean {
  return existsSync(path.join(dir, fileName));
}
