import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { schemaOptions, BaseModel } from '@pos-app/utils';
import { ProductStock, ProductStockSchema } from './product.model.sub';

export const PRODUCT_MODEL_COLLECTION = 'products';

export enum ProductCategory {
  ELECTRONICS = 'electronics',
  CLOTHING = 'clothing',
  FOOD = 'food',
  BOOKS = 'books',
  // TODO: Add more categories
}

@Schema(schemaOptions<Product>(PRODUCT_MODEL_COLLECTION))
export class Product extends BaseModel {
  @Prop({
    required: true,
    unique: true,
    minlength: 2,
  })
  name: string;

  @Prop({
    required: true,
    minlength: 10,
  })
  description: string;

  @Prop({
    required: true,
    min: 0.01,
  })
  price: number;

  @Prop({
    required: true,
    unique: true,
    minlength: 2,
  })
  sku: string;

  @Prop({
    required: true,
    enum: Object.values(ProductCategory),
    type: String,
  })
  category: ProductCategory;

  @Prop({
    required: true,
    type: ProductStockSchema,
    default: (): ProductStock => ({
      availableQuantity: 0,
      reservedQuantity: 0,
    }),
  })
  stock: ProductStock;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

export type ProductDocument = HydratedDocument<Product>;
