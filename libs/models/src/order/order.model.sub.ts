import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ensureRefIntegrity } from '@pos-app/utils';
import {
  Schema as _Schema,
  Types,
  HydratedDocument,
  CallbackWithoutResultAndOptionalError,
} from 'mongoose';
import { PRODUCT_MODEL_COLLECTION, Product } from './product.model';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class OrderShippingAddress {
  @ApiProperty()
  @Prop({
    required: true,
  })
  street!: string;

  @ApiProperty()
  @Prop({
    required: true,
  })
  city!: string;

  @ApiProperty()
  @Prop({
    required: true,
  })
  state!: string;

  @ApiProperty()
  @Prop({
    required: true,
  })
  zip!: string;

  @ApiProperty()
  @Prop({
    required: true,
  })
  country!: string;
}

export const OrderShippingAddressSchema =
  SchemaFactory.createForClass(OrderShippingAddress);

@Schema({ _id: false })
export class OrderItem {
  @ApiProperty({ type: String })
  @Prop({
    required: true,
    type: _Schema.Types.ObjectId,
    ref: PRODUCT_MODEL_COLLECTION,
  })
  productId!: Types.ObjectId;

  @ApiProperty({ minimum: 1 })
  @Prop({
    required: true,
    min: 1,
  })
  quantity!: number;

  @ApiProperty({ minimum: 0.01 })
  @Prop({
    min: 0.01,
  })
  price?: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

OrderItemSchema.pre('save', ensureRefIntegrity);
OrderItemSchema.pre('save', setCurrentProductPrice);

async function setCurrentProductPrice(
  this: HydratedDocument<OrderItem>,
  next: CallbackWithoutResultAndOptionalError
) {
  const productCollection = this.$parent()?.db.collection<Product>(
    PRODUCT_MODEL_COLLECTION
  );

  const product = await productCollection?.findOne({ _id: this.productId });

  if (!product) {
    throw new Error('Product not found.');
  }

  this.price = product.price;

  next();
}
