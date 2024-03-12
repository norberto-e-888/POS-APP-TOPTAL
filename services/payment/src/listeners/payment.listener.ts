import {
  AmqpConnection,
  Nack,
  RabbitSubscribe,
} from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';
import { Order, OrderType, Product } from '@pos-app/models';
import { STRIPE } from '../lib';
import Stripe from 'stripe';
import { Exchange } from '../app/amqp';

@Injectable()
export class PaymentListener {
  constructor(
    @Inject(STRIPE)
    private readonly stripe: Stripe,
    private readonly amqp: AmqpConnection
  ) {}

  @RabbitSubscribe({
    exchange: 'order.placed',
    routingKey: `*.*.*.*.${OrderType.ONLINE}`,
    queue: 'payment.charge-online-order',
  })
  protected async handleChargeOnlineOrder(event: {
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

  @RabbitSubscribe({
    exchange: 'order.placed',
    routingKey: `*.*.*.*.${OrderType.IN_STORE}`,
    queue: 'payment.charge-in-store-order',
  })
  protected async handleChargeInStoreOrder(event: {
    order: Order;
    products: {
      [key: string]: Product;
    };
  }) {
    try {
      console.log('PAYMENT.CHARGE-IN-STORE-ORDER EVENT:', event);

      const result = await this.stripe.customers.search({
        query: `metadata["mongoId"]:"${event.order.customerId}"`,
      });

      if (!result.data.length) {
        console.log('No customer found with mongoId: ', event.order.customerId);
        return new Nack(false);
      }

      const charge = await this.stripe.charges.create(
        {
          amount: event.order.total,
          currency: 'usd',
          source: 'tok_visa',
          description: `In-store order payment for order: ${event.order.id}`,
        },
        {
          idempotencyKey: event.order.id,
        }
      );

      await this.amqp.publish(Exchange.CHECKOUT_COMPLETED, 'usd', {
        metadata: {
          mongoId: event.order.id,
        },
      });

      console.log('STRIPE PAYMENT CHARGE: ', charge);

      return new Nack(false);
    } catch (error) {
      console.log('PAYMENT.CHARGE-IN-STORE-ORDER ERROR: ', error);
      return new Nack(false);
    }
  }
}
