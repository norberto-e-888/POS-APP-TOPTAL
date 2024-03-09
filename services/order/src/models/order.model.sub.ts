import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ensureRefIntegrity } from '@pos-app/utils';
import { Schema as _Schema, Types, HydratedDocument } from 'mongoose';
import { PRODUCT_MODEL_COLLECTION } from './product.model';

@Schema({ _id: false })
export class OrderShippingAddress {
  @Prop({
    required: true,
  })
  street: string;

  @Prop({
    required: true,
  })
  city: string;

  @Prop({
    required: true,
  })
  state: string;

  @Prop({
    required: true,
  })
  zip: string;

  @Prop({
    required: true,
  })
  country: string;
}

export const OrderShippingAddressSchema =
  SchemaFactory.createForClass(OrderShippingAddress);

@Schema({ _id: false })
export class OrderItem {
  @Prop({
    required: true,
    type: _Schema.Types.ObjectId,
    ref: PRODUCT_MODEL_COLLECTION,
  })
  productId: Types.ObjectId;

  @Prop({
    required: true,
    min: 1,
  })
  quantity: number;

  @Prop({
    required: true,
    min: 0.01,
  })
  price: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

OrderItemSchema.pre('save', ensureRefIntegrity);
OrderItemSchema.pre('save', setCurrentProductPrice);

async function setCurrentProductPrice(this: HydratedDocument<OrderItem>) {
  const productCollection = this.db.collection(PRODUCT_MODEL_COLLECTION);
  const product = await productCollection.findOne({ _id: this.productId });
  if (!product) {
    throw new Error('Product not found.');
  }

  this.price = product.price;
}
