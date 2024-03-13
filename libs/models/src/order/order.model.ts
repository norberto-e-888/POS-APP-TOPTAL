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
import { ApiProperty } from '@nestjs/swagger';

export const ORDER_MODEL_COLLECTION = 'orders';

export enum OrderStatus {
  DRAFTING = 'drafting',
  PLACED = 'placed',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERY_IN_PROGRESS = 'delivery-in-progress',
  DELIVERED = 'delivered',
  IN_STORE_COMPLETED = 'in-store-completed',
  CANCELLED = 'cancelled',
  FAILED_SHIPPING = 'failed-shipping',
  FAILED_DELIVERY = 'failed-delivery',
  FAILED_PAYMENT = 'failed-payment',
}

export enum OrderType {
  IN_STORE = 'in-store',
  ONLINE = 'online',
}

@Schema(
  schemaOptions<Order>(ORDER_MODEL_COLLECTION, { omitFromTransform: ['hash'] })
)
export class Order extends BaseModel {
  @ApiProperty()
  @Prop({
    required: true,
  })
  customerId!: string;

  @ApiProperty({ type: OrderShippingAddress })
  @Prop({
    required: function (this: Order) {
      return this.status !== OrderStatus.DRAFTING;
    },
    type: OrderShippingAddressSchema,
  })
  shippingAddress?: OrderShippingAddress;

  @ApiProperty({ enum: Object.values(OrderStatus) })
  @Prop({
    required: true,
    enum: Object.values(OrderStatus),
    type: String,
    default: OrderStatus.DRAFTING,
  })
  status!: OrderStatus;

  @ApiProperty({ type: [OrderItem] })
  @Prop({
    required: true,
    type: [OrderItemSchema],
    minlength: 1,
  })
  items!: OrderItem[];

  @ApiProperty({ minimum: 0.01 })
  @Prop({
    min: 0.01,
  })
  total!: number;

  @ApiProperty({ enum: Object.values(OrderType) })
  @Prop({
    required: true,
    enum: Object.values(OrderType),
    type: String,
  })
  type!: OrderType;

  @Prop()
  hash!: string;
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
    (total, { price, quantity }) => total + quantity * (price as number),
    0
  );

  next();
}

export async function getOrderhHash(order: Order, userId: string) {
  if (!order.shippingAddress) {
    throw new Error('Order shipping address is required.');
  }

  const shippingAddressHash = `${order.shippingAddress.country}.${order.shippingAddress.state}.${order.shippingAddress.city}.${order.shippingAddress.street}.${order.shippingAddress.zip}`;
  const itemsHash = order.items
    .map((item: OrderItem) => {
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
  if (this.status === OrderStatus.PLACED) {
    this.hash = await getOrderhHash(this, this.customerId);
  }

  next();
}
