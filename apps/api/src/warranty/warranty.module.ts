import { Module } from "@nestjs/common";
import { WarrantyController } from "./warranty.controller";
import { WarrantyService } from "./warranty.service";
import { FilesModule } from "../files/files.module";

@Module({
  imports: [FilesModule],
  controllers: [WarrantyController],
  providers: [WarrantyService],
  exports: [WarrantyService],
})
export class WarrantyModule {}
