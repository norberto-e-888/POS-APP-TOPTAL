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
    set: function (this: CustomerAggregation) {
      return this.totalAmount / this.numberOfPayments;
    },
  })
  averageAmount!: number;

  @Prop({
    type: Object,
    default: {},
  })
  productFrequency!: Record<string, number>;

  @Prop({
    required: true,
  })
  customerId!: string;
}

export const CustomerAggregationSchema =
  SchemaFactory.createForClass(CustomerAggregation);

export type CustomerAggregationDocument = HydratedDocument<CustomerAggregation>;
