import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Authenticated, Roles } from '@pos-app/auth';
import { ProductService } from '../services';
import {
  AddProductStockBody,
  CreateProductBody,
  ProductsQuery,
} from '../validators';
import { ApiTags } from '@nestjs/swagger';
import { Product } from '@pos-app/models';

@UseGuards(Authenticated)
@ApiTags(Product.name)
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Roles(['admin'])
  @Post()
  async handleCreateProduct(@Body() body: CreateProductBody) {
    return this.productService.createProduct(body);
  }

  @Roles(['admin'])
  @Patch(':id/add-stock')
  async handleAddStock(
    @Body() body: AddProductStockBody,
    @Param('id') id: string
  ) {
    return this.productService.addStock(body, id);
  }

  @Roles(['admin', 'customer'])
  @Get()
  async handleQueryProducts(@Query() query: ProductsQuery) {
    return this.productService.queryProducts(query);
  }
}
