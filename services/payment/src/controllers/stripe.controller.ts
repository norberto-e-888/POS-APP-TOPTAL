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
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Exchange } from '../app/amqp';
import { OrderType } from '@pos-app/models';

@Controller()
export class StripeController {
  constructor(
    @Inject(STRIPE)
    private readonly stripe: Stripe,
    private readonly configService: ConfigService<Config>,
    private readonly amqp: AmqpConnection
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
        case 'checkout.session.completed':
          const checkoutSession = event.data.object;
          console.log('CHECKOUT SESSION COMPLETED: ', checkoutSession);
          await this.amqp.publish(
            Exchange.CHECKOUT_COMPLETED,
            `${checkoutSession.currency}.${OrderType.ONLINE}`,
            checkoutSession
          );
          return 'Ok.';

        case 'checkout.session.expired':
        case 'checkout.session.async_payment_failed':
          const failedSession = event.data.object;
          console.log('CHECKOUT SESSION FAILED: ', failedSession);
          await this.amqp.publish(
            Exchange.CHECKOUT_FALIED,
            `${failedSession.currency}.${OrderType.ONLINE}`,
            failedSession
          );
          return 'Ok.';

        case 'charge.succeeded':
        case 'charge.captured':
          const charge = event.data.object;
          console.log('CHARGE CAPTURED: ', charge);
          await this.amqp.publish(
            Exchange.CHECKOUT_COMPLETED,
            `${charge.currency}.${OrderType.IN_STORE}`,
            charge
          );
          return 'Ok.';

        case 'payment_intent.payment_failed':
        case 'charge.failed':
          const failedCharge = event.data.object;
          console.log('CHARGE FAILED: ', failedCharge);
          await this.amqp.publish(
            Exchange.CHECKOUT_FALIED,
            `${failedCharge.currency}.${OrderType.IN_STORE}`,
            failedCharge
          );
          return 'Ok.';

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

        default:
          console.log(`Unhandled event type ${event.type}`);
          return 'Ok.';
      }
    } catch (err) {
      console.log('ERROR: ', err);
      throw new HttpException('Webhook Error.', HttpStatus.BAD_REQUEST);
    }
  }
}
