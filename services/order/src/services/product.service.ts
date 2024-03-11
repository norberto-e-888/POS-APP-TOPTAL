import { Injectable } from '@nestjs/common';
import { AddProductStockBody, CreateProductBody } from '../validators';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '@pos-app/models';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<Product>
  ) {}

  async createProduct(dto: CreateProductBody) {
    const product = new this.productModel(dto);
    await product.save();
    return product.toObject();
  }

  async addStock(dto: AddProductStockBody, productId: string) {
    const updatedProduct = await this.productModel.findByIdAndUpdate(
      productId,
      {
        $inc: {
          'stock.availableQuantity': dto.quantity,
        },
      },
      { new: true }
    );

    return updatedProduct.toObject();
  }
}
