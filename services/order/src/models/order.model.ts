import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  HydratedDocument,
  CallbackWithoutResultAndOptionalError,
} from 'mongoose';
import { BaseModel } from '@pos-app/models';
import { schemaOptions } from '@pos-app/utils';
import {
  OrderItem,
  OrderItemSchema,
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
    default: OrderStatus.PLACED,
  })
  status: OrderStatus;

  @Prop({
    required: true,
    type: [OrderItemSchema],
    minlength: 1,
  })
  items: OrderItem[];

  @Prop({
    min: 0.01,
  })
  total: number;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.pre('save', calculateTotal);

export type OrderDocument = HydratedDocument<Order>;

async function calculateTotal(
  this: HydratedDocument<Order>,
  next: CallbackWithoutResultAndOptionalError
) {
  this.total = this.items.reduce(
    (total, { price, quantity }) => total + quantity * price,
    0
  );

  next();
}
