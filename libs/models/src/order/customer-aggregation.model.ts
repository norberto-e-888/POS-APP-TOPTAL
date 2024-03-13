import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { schemaOptions, BaseModel } from '@pos-app/utils';

export const CUSTOMER_AGGREGATION_MODEL_COLLECTION = 'customer_aggregations';

@Schema(
  schemaOptions<CustomerAggregation>(CUSTOMER_AGGREGATION_MODEL_COLLECTION)
)
export class CustomerAggregation extends BaseModel {
  @Prop({
    default: 0,
    required: true,
  })
  numberOfPayments!: number;

  @Prop({
    default: 0,
    required: true,
  })
  totalAmount!: number;

  @Prop({
    default: 0,
    required: true,
  })
  averageAmount!: number;

  @Prop({
    type: Map,
    of: Number,
  })
  productFrequency!: Map<string, number>;

  @Prop({
    required: true,
    unique: true,
  })
  customerId!: string;
}

export const CustomerAggregationSchema =
  SchemaFactory.createForClass(CustomerAggregation);

export type CustomerAggregationDocument = HydratedDocument<CustomerAggregation>;
