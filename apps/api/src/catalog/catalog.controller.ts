import { Controller, Get, Param } from "@nestjs/common";
import { CatalogService } from "./catalog.service";

@Controller()
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get("products")
  products() {
    return this.catalog.listProducts();
  }

  @Get("products/:slug")
  product(@Param("slug") slug: string) {
    return this.catalog.getProduct(slug);
  }

  @Get("categories")
  categories() {
    return this.catalog.listCategories();
  }
}
