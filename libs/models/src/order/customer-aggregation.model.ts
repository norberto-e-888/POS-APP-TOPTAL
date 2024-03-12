import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { schemaOptions, BaseModel } from '@pos-app/utils';

export const CUSTOMER_AGGREGATION_MODEL_COLLECTION = 'customer_aggregations';

@Schema(schemaOptions(CUSTOMER_AGGREGATION_MODEL_COLLECTION))
export class CustomerAggregation extends BaseModel {
  @Prop({
    default: 0,
  })
  numberOfPayments!: number;

  @Prop({
    default: 0,
  })
  totalAmount!: number;

  @Prop({
    default: 0,
    set: (value: number) => value / 100,
  })
  averageAmount!: number;

  @Prop({
    type: Object,
    default: {},
  })
  productFrequency!: Record<string, number>;
}

export const CustomerAggregationSchema =
  SchemaFactory.createForClass(CustomerAggregation);

export type CustomerAggregationDocument = HydratedDocument<CustomerAggregation>;
