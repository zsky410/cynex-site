import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { AdminAuthGuard, JwtAuthGuard } from "../auth/guards";
import { CurrentAdmin, CurrentUser, type AuthAdmin, type AuthUser } from "../common/current-user.decorator";
import { FilesService } from "./files.service";

const uploadInterceptor = FileInterceptor("file", {
  storage: memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});

@UseGuards(JwtAuthGuard)
@Controller("files")
export class FilesController {
  constructor(private readonly files: FilesService) {}

  @Post("upload")
  @UseInterceptors(uploadInterceptor)
  upload(@CurrentUser() user: AuthUser, @UploadedFile() file?: UploadedMultipartFile) {
    return this.files.uploadForUser(user.id, normalizeFile(file));
  }

  @Get(":id/content")
  async content(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    const file = await this.files.getForUser(user.id, id);
    return new StreamableFile(file.body, {
      type: file.mimeType,
      disposition: `inline; filename="${encodeURIComponent(file.fileName)}"`,
    });
  }
}

@UseGuards(AdminAuthGuard)
@Controller("admin/files")
export class AdminFilesController {
  constructor(private readonly files: FilesService) {}

  @Post("upload")
  @UseInterceptors(uploadInterceptor)
  upload(@CurrentAdmin() admin: AuthAdmin, @UploadedFile() file?: UploadedMultipartFile) {
    return this.files.uploadForAdmin(admin.id, normalizeFile(file));
  }

  @Delete(":id")
  delete(@CurrentAdmin() admin: AuthAdmin, @Param("id") id: string) {
    return this.files.deleteAdminFile(admin.id, id);
  }

  @Get(":id/content")
  async content(@Param("id") id: string) {
    const file = await this.files.getForAdmin(id);
    return new StreamableFile(file.body, {
      type: file.mimeType,
      disposition: `inline; filename="${encodeURIComponent(file.fileName)}"`,
    });
  }
}

type UploadedMultipartFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

function normalizeFile(file?: UploadedMultipartFile) {
  if (!file) throw new BadRequestException("Thiếu tệp tải lên");
  return file;
}
