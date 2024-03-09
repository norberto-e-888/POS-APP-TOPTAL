import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { schemaOptions, BaseModel } from '@pos-app/utils';

export const STRIPE_PAYMENT_MODEL_COLLECTION = 'stripe-payments';

@Schema(schemaOptions(STRIPE_PAYMENT_MODEL_COLLECTION))
export class StripePayment extends BaseModel {}

export const StripePaymentSchema = SchemaFactory.createForClass(StripePayment);

export type StripePaymentDocument = HydratedDocument<StripePayment>;
