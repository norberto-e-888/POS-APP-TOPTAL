import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

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
