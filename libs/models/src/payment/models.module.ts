import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StripePayment, StripePaymentSchema } from './stripe-payment.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: StripePayment.name,
        schema: StripePaymentSchema,
      },
    ]),
  ],
  exports: [MongooseModule],
})
export class PaymentModelsModule {}
