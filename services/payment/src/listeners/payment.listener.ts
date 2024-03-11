import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';
import { Order, Product, User } from '@pos-app/models';
import { STRIPE } from '../lib';
import Stripe from 'stripe';

@Injectable()
export class PaymentListener {
  constructor(
    @Inject(STRIPE)
    private readonly stripe: Stripe
  ) {}

  @RabbitSubscribe({
    exchange: 'auth.sign-up',
    routingKey: 'customer',
    queue: 'payment.create-customer',
  })
  protected async handleCreateCustomer(event: User) {
    try {
      console.log('PAYMENT.CREATE-CUSTOMER EVENT:', event);
      const customer = await this.stripe.customers.create({
        email: event.email,
        name: `${event.firstName} ${event.lastName}`,
        metadata: {
          mongoId: event.id,
        },
      });

      console.log('STRIPE CUSTOMER: ', customer);

      return new Nack(false);
    } catch (error) {
      console.log('PAYMENT.CREATE-CUSTOMER ERROR: ', error);
      return new Nack(false);
    }
  }

  @RabbitSubscribe({
    exchange: 'order.placed',
    routingKey: '#',
    queue: 'payment.charge-order',
  })
  protected async handleChargeOrder(event: {
    order: Order;
    products: {
      [key: string]: Product;
    };
  }) {
    try {
      console.log('PAYMENT.CHARGE-ORDER EVENT:', event);

      const result = await this.stripe.customers.search({
        query: `metadata["mongoId"]:"${event.order.customerId}"`,
      });

      if (!result.data.length) {
        console.log('No customer found with mongoId: ', event.order.customerId);
        return new Nack(false);
      }

      const session = await this.stripe.checkout.sessions.create({
        customer: result.data[0].id,
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: event.order.items.map((item) => {
          return {
            price_data: {
              currency: 'usd',
              product_data: {
                name: event.products[
                  typeof item.productId === 'string'
                    ? item.productId
                    : item.productId.toString()
                ].name,
              },
              unit_amount: item.price,
            },
            quantity: item.quantity,
          };
        }),
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        metadata: {
          mongoId: event.order.id,
        },
        payment_intent_data: {
          metadata: {
            mongoId: event.order.id,
          },
        },
      });

      console.log('STRIPE CHECKOUT URL: ', session.url);

      return new Nack(false);
    } catch (error) {
      console.log('PAYMENT.CHARGE-ORDER ERROR: ', error);
      return new Nack(false);
    }
  }
}
