import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { schemaOptions, BaseModel } from '@pos-app/utils';
import { ProductStock, ProductStockSchema } from './product.model.sub';
import { ApiProperty } from '@nestjs/swagger';

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
  @ApiProperty({ minLength: 2 })
  @Prop({
    required: true,
    unique: true,
    minlength: 2,
  })
  name!: string;

  @ApiProperty({ minLength: 10 })
  @Prop({
    required: true,
    minlength: 10,
  })
  description!: string;

  @ApiProperty({ minimum: 1, description: 'Price in cents.' })
  @Prop({
    required: true,
    min: 1,
    isInteger: true,
    index: true,
  })
  price!: number;

  @ApiProperty({ enum: Object.values(ProductCategory) })
  @Prop({
    required: true,
    enum: Object.values(ProductCategory),
    type: String,
    index: true,
  })
  category!: ProductCategory;

  @ApiProperty({ type: ProductStock })
  @Prop({
    required: true,
    type: ProductStockSchema,
    default: (): ProductStock => ({
      availableQuantity: 0,
      reservedQuantity: 0,
    }),
  })
  stock!: ProductStock;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

export type ProductDocument = HydratedDocument<Product>;
