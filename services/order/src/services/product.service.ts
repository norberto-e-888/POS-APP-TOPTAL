import { Injectable } from '@nestjs/common';
import {
  AddProductStockBody,
  CreateProductBody,
  ProductsQuery,
} from '../validators';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product } from '@pos-app/models';
import { defaultPagination } from '@pos-app/utils';

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

  async queryProducts(query: ProductsQuery) {
    const { page, size } = defaultPagination(query.pagination);
    const skip = (page - 1) * size;
    const { category } = query;
    const filter = category ? { category } : {};
    const sort = {
      [query.sortByField || 'createdAt']: query.sortOrder || 'desc',
    };

    const products = await this.productModel
      .find(filter)
      .skip(skip)
      .limit(size)
      .sort(sort);

    return products.map((product) => product.toObject());
  }
}
