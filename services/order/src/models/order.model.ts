import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';
import { BaseModel } from '@pos-app/models';
import { schemaOptions } from '@pos-app/utils';
import {
  OrderShippingAddress,
  OrderShippingAddressSchema,
} from './order.model.sub';

export const ORDER_MODEL_COLLECTION = 'orders';

export enum OrderStatus {
  PLACED = 'placed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Schema(schemaOptions(ORDER_MODEL_COLLECTION))
export class Order extends BaseModel {
  @Prop({
    required: true,
  })
  customerId: string;

  @Prop({
    required: true,
    type: OrderShippingAddressSchema,
  })
  shippingAddress: OrderShippingAddress;

  @Prop({
    required: true,
    enum: Object.values(OrderStatus),
    type: String,
  })
  status: OrderStatus;

  @Prop({
    required: true,
    type: [Types.ObjectId],
    minlength: 1,
  })
  products: Types.ObjectId[];

  @Prop({
    required: true,
    min: 0.01,
  })
  total: number;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.pre('save', async function (this: HydratedDocument<Order>) {
  const productsCollection = this.db.collection<{
    price: number;
    amount: number;
  }>('products');

  const products = await productsCollection
    .find({
      _id: { $in: this.products },
    })
    .toArray();

  this.total = products.reduce(
    (total, product) => total + product.amount * product.price,
    0
  );
});

export type OrderDocument = HydratedDocument<Order>;
