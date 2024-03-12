import {
  Body,
  Controller,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Authenticated, Roles } from '@pos-app/auth';
import { ProductService } from '../services';
import { AddProductStockBody, CreateProductBody } from '../validators';

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @UseGuards(Authenticated)
  @Roles(['admin'])
  @Post('product')
  async handleCreateProduct(@Body() body: CreateProductBody) {
    return this.productService.createProduct(body);
  }

  @UseGuards(Authenticated)
  @Roles(['admin'])
  @Patch('product/:id/add-stock')
  async handleAddStock(
    @Body() body: AddProductStockBody,
    @Param('id') id: string
  ) {
    return this.productService.addStock(body, id);
  }
}
