/* eslint-disable no-case-declarations */
import {
  Body,
  Controller,
  Headers,
  HttpException,
  HttpStatus,
  Inject,
  Post,
} from '@nestjs/common';
import Stripe from 'stripe';

import { STRIPE } from '../lib';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config';

@Controller()
export class StripeController {
  constructor(
    @Inject(STRIPE)
    private readonly stripe: Stripe,
    private readonly configService: ConfigService<Config>
  ) {}

  @Post('stripe-webhook')
  async handleStripeWebhook(
    @Body() body: string | Buffer,
    @Headers() headers: { 'stripe-signature': string }
  ) {
    try {
      if (!headers['stripe-signature']) {
        throw new HttpException('Invalid Signature.', HttpStatus.BAD_REQUEST);
      }

      const sig = headers['stripe-signature'];

      const event = this.stripe.webhooks.constructEvent(
        body,
        sig,
        this.configService.get<Config['stripe']>('stripe').webhookSecret
      );

      switch (event.type) {
        case 'payment_intent.created':
          const paymentIntentCreated = event.data.object;
          console.log('PAYMENT INTENT CREATED: ', paymentIntentCreated);
          // Then define and call a function to handle the event payment_intent.created
          return 'Ok.';
        case 'payment_intent.succeeded':
          const paymentIntentSucceeded = event.data.object;
          console.log('PAYMENT INTENT SUCCEEDED: ', paymentIntentSucceeded);
          // Then define and call a function to handle the event payment_intent.succeeded
          return 'Ok.';

        case 'charge.succeeded':
          const chargeSucceeded = event.data.object;
          console.log('CHARGE SUCCEEDED: ', chargeSucceeded);
          // Then define and call a function to handle the event charge.succeeded
          return 'Ok.';
        default:
          console.log(`Unhandled event type ${event.type}`);
          return 'Ok.';
      }
    } catch (err) {
      console.log('ERROR: ', err);
      throw new HttpException('Webhook Error', HttpStatus.BAD_REQUEST);
    }
  }
}
