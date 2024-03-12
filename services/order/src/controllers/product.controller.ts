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

  @UseGuards(Authenticated)
  @Roles(['admin', 'customer'])
  @Get('product')
  async handleQueryProducts(@Query() query: ProductsQuery) {
    return this.productService.queryProducts(query);
  }
}
