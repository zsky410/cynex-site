import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { PrismaService } from "../prisma/prisma.service";
import type { FileDescriptor } from "./file-descriptor";

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

type FileActorType = "user" | "admin";
type StoredFileRecord = {
  id?: string;
  storageDriver: string;
  storageKey: string;
};

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 1600;
const IMAGE_WEBP_QUALITY = 82;
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

  async assertUserOwnsFiles(userId: string, fileIds: string[]) {
    await this.assertOwnedFiles("user", userId, fileIds);
  }

  async assertAdminOwnsFiles(adminId: string, fileIds: string[]) {
    await this.assertOwnedFiles("admin", adminId, fileIds);
  }

  async resolveFilesForUser(userId: string, fileIds: string[]): Promise<FileDescriptor[]> {
    return this.resolveFiles({
      fileIds,
      where: { uploadedByUserId: userId },
      contentPathBuilder: (id) => `/files/${id}/content`,
    });
  }

  async resolveFilesForAdmin(fileIds: string[]): Promise<FileDescriptor[]> {
    return this.resolveFiles({
      fileIds,
      where: {},
      contentPathBuilder: (id) => `/admin/files/${id}/content`,
    });
  }

  async resolvePublicFiles(fileIds: string[]): Promise<FileDescriptor[]> {
    return this.resolveFiles({
      fileIds,
      where: {},
      contentPathBuilder: (id) => `/admin/files/${id}/content`,
    });
  }

  async deleteAdminFile(adminId: string, fileId: string) {
    const file = await this.prisma.fileObject.findFirst({
      where: { id: fileId, uploadedByAdminId: adminId },
    });
    if (!file) throw new NotFoundException("Tệp không tồn tại");
    await this.assertFileIsUnreferenced(fileId);
    await this.deleteStoredFile(file);
    return { id: fileId };
  }

  async deleteUnreferencedFiles(fileIds: string[]) {
    const ids = uniqueIds(fileIds);
    for (const id of ids) {
      if (await this.isFileReferenced(id)) continue;
      const file = await this.prisma.fileObject.findUnique({ where: { id } });
      if (file) await this.deleteStoredFile(file);
    }
  }

  async deleteR2ObjectsForRecords(files: StoredFileRecord[]) {
    for (const file of files) {
      if (file.storageDriver === "r2") {
        await this.deleteR2Object(file.storageKey);
      }
    }
  }

  private async upload(actorType: "user" | "admin", actorId: string, file: UploadableFile | undefined) {
    validateUpload(file);
    assertR2Configured();
    const preparedFile = await prepareFileForStorage(file);
    const ext = path.extname(preparedFile.originalname).toLowerCase();
    const storageKey = `${actorType}/${actorId}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}${ext}`;
    const client = r2Client();
    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: storageKey,
        Body: preparedFile.buffer,
        ContentType: preparedFile.mimetype,
      }),
    );
    const base = (process.env.R2_PUBLIC_BASE_URL ?? "").trim();
    const publicUrl = base ? `${base.replace(/\/$/, "")}/${storageKey}` : undefined;

    const created = await this.prisma.fileObject.create({
      data: {
        fileName: preparedFile.originalname,
        mimeType: preparedFile.mimetype,
        size: preparedFile.size,
        storageDriver: "r2",
        storageBucket: process.env.R2_BUCKET,
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
    if (driver !== "r2") {
      throw new NotFoundException("Tệp không khả dụng trên R2");
    }
    assertR2Configured();
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

  private async assertFileIsUnreferenced(fileId: string) {
    if (await this.isFileReferenced(fileId)) {
      throw new ConflictException("Tệp đang được sử dụng, hãy lưu thay đổi hoặc xóa dữ liệu liên kết trước");
    }
  }

  private async isFileReferenced(fileId: string) {
    const [productImageCount, productGuideCount, sourceProofCount] = await Promise.all([
      this.prisma.product.count({ where: { imageFileId: fileId } }),
      this.prisma.product.count({ where: { guideFileIds: { array_contains: [fileId] } as any } }),
      this.prisma.sourceOrder.count({ where: { proofFileIds: { array_contains: [fileId] } as any } }),
    ]);
    return productImageCount + productGuideCount + sourceProofCount > 0;
  }

  private async deleteStoredFile(file: StoredFileRecord) {
    if (file.storageDriver === "r2") {
      await this.deleteR2Object(file.storageKey);
    }
    if (file.id) {
      await this.prisma.fileObject.delete({ where: { id: file.id } });
    }
  }

  private async deleteR2Object(storageKey: string) {
    assertR2Configured();
    const client = r2Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: storageKey,
      }),
    );
  }

  private async assertOwnedFiles(actorType: FileActorType, actorId: string, fileIds: string[]) {
    if (!fileIds.length) return;
    const where =
      actorType === "admin"
        ? { id: { in: fileIds }, uploadedByAdminId: actorId }
        : { id: { in: fileIds }, uploadedByUserId: actorId };
    const files = await this.prisma.fileObject.findMany({
      where,
      select: { id: true },
    });
    if (files.length !== fileIds.length) {
      throw new BadRequestException("Tệp đính kèm không hợp lệ");
    }
  }

  private async resolveFiles(input: {
    fileIds: string[];
    where: Record<string, unknown>;
    contentPathBuilder: (id: string) => string;
  }): Promise<FileDescriptor[]> {
    const ids = uniqueIds(input.fileIds);
    if (!ids.length) return [];
    const files = await this.prisma.fileObject.findMany({
      where: {
        ...input.where,
        id: { in: ids },
      },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        size: true,
        publicUrl: true,
      },
    });
    const byId = new Map(files.map((file) => [file.id, file]));
    const resolved: FileDescriptor[] = [];
    for (const id of ids) {
      const file = byId.get(id);
      if (!file) continue;
      resolved.push({
        id: file.id,
        fileName: file.fileName,
        mimeType: file.mimeType,
        size: file.size,
        publicUrl: file.publicUrl,
        contentPath: input.contentPathBuilder(file.id),
      });
    }
    return resolved;
  }
}

export async function prepareFileForStorage(file: UploadableFile): Promise<UploadableFile> {
  if (!file.mimetype.startsWith("image/")) return file;

  let compressed: Buffer;
  try {
    compressed = await sharp(file.buffer)
      .rotate()
      .resize({
        width: MAX_IMAGE_DIMENSION,
        height: MAX_IMAGE_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: IMAGE_WEBP_QUALITY })
      .toBuffer();
  } catch {
    throw new BadRequestException("Ảnh tải lên không hợp lệ");
  }

  if (compressed.length >= file.buffer.length) return file;

  return {
    originalname: replaceFileExtension(file.originalname, ".webp"),
    mimetype: "image/webp",
    size: compressed.length,
    buffer: compressed,
  };
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

function hasR2Config(): boolean {
  return Boolean(
    process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET &&
      (process.env.R2_ENDPOINT || process.env.R2_ACCOUNT_ID),
  );
}

function assertR2Configured() {
  if (hasR2Config()) return;
  throw new ServiceUnavailableException("R2 chưa được cấu hình đầy đủ");
}

function uniqueIds(fileIds: string[]) {
  return Array.from(new Set(fileIds.filter(Boolean)));
}

function replaceFileExtension(fileName: string, extension: string) {
  const parsed = path.parse(fileName);
  return `${parsed.name}${extension}`;
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
