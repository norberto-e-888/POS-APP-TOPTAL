import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Stripe } from 'stripe';
import { Config } from '../config';

export const STRIPE = Symbol('STRIPE');

export const StripeProvider: Provider = {
  provide: STRIPE,
  inject: [ConfigService],
  useFactory: (config: ConfigService<Config>) => {
    const { secret, accountId } = config.get<Config['stripe']>('stripe');

    return new Stripe(secret, {
      stripeAccount: accountId,
    });
  },
};
