import { Module } from "@nestjs/common";
import { FilesController, AdminFilesController } from "./files.controller";
import { FilesService } from "./files.service";

@Module({
  controllers: [FilesController, AdminFilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
