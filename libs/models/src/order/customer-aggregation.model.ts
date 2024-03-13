import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { schemaOptions, BaseModel } from '@pos-app/utils';
import { ApiProperty } from '@nestjs/swagger';

export const CUSTOMER_AGGREGATION_MODEL_COLLECTION = 'customer_aggregations';

@Schema(
  schemaOptions<CustomerAggregation>(CUSTOMER_AGGREGATION_MODEL_COLLECTION)
)
export class CustomerAggregation extends BaseModel {
  @ApiProperty()
  @Prop({
    default: 0,
    required: true,
  })
  numberOfPayments!: number;

  @ApiProperty()
  @Prop({
    default: 0,
    required: true,
    index: true,
  })
  totalAmount!: number;

  @ApiProperty()
  @Prop({
    default: 0,
    required: true,
    index: true,
  })
  averageAmount!: number;

  @ApiProperty({ type: Map })
  @Prop({
    type: Map,
    of: Number,
  })
  productFrequency!: Map<string, number>;

  @ApiProperty()
  @Prop({
    required: true,
    unique: true,
  })
  customerId!: string;
}

export const CustomerAggregationSchema =
  SchemaFactory.createForClass(CustomerAggregation);

export type CustomerAggregationDocument = HydratedDocument<CustomerAggregation>;
