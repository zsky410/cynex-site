import { Module } from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { CatalogController } from "./catalog.controller";
import { FilesModule } from "../files/files.module";

@Module({
  imports: [FilesModule],
  controllers: [CatalogController],
  providers: [CatalogService],
})
export class CatalogModule {}
