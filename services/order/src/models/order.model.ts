import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  HydratedDocument,
  CallbackWithoutResultAndOptionalError,
  Types,
} from 'mongoose';
import { schemaOptions, BaseModel } from '@pos-app/utils';
import {
  OrderItem,
  OrderItemSchema,
  OrderShippingAddress,
  OrderShippingAddressSchema,
} from './order.model.sub';
import { CreateOrderBody, OrderItemValidator } from '../validators';

export const ORDER_MODEL_COLLECTION = 'orders';

export enum OrderStatus {
  PLACED = 'placed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

@Schema(
  schemaOptions<Order>(ORDER_MODEL_COLLECTION, { omitFromTransform: ['hash'] })
)
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

  @Prop()
  hash: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.pre('save', setTotal);
OrderSchema.pre('save', setHash);

OrderSchema.index({ hash: 1, createdAt: 1 });

export type OrderDocument = HydratedDocument<Order>;

async function setTotal(
  this: HydratedDocument<Order>,
  next: CallbackWithoutResultAndOptionalError
) {
  this.total = this.items.reduce(
    (total, { price, quantity }) => total + quantity * price,
    0
  );

  next();
}

export async function getOrderhHash(
  order: Order | CreateOrderBody,
  userId: string
) {
  const shippingAddressHash = `${order.shippingAddress.country}.${order.shippingAddress.state}.${order.shippingAddress.city}.${order.shippingAddress.street}.${order.shippingAddress.zip}`;
  const itemsHash = order.items
    .map((item: OrderItem | OrderItemValidator) => {
      if (item.productId instanceof Types.ObjectId) {
        return item;
      }

      return {
        ...item,
        productId: new Types.ObjectId(item.productId),
      };
    })
    .sort((a, b) =>
      a.productId.toString().localeCompare(b.productId.toString())
    )
    .reduce(
      (hash, item, i) =>
        i === 0
          ? `${item.productId}.${item.quantity}`
          : `${hash}.${item.productId}.${item.quantity}`,
      ''
    );

  return `${userId}.${shippingAddressHash}.${itemsHash}`;
}

async function setHash(
  this: HydratedDocument<Order>,
  next: CallbackWithoutResultAndOptionalError
) {
  this.hash = await getOrderhHash(this, this.customerId);

  next();
}
