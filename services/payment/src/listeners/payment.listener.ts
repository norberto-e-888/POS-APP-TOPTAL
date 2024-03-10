import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Inject, Injectable } from '@nestjs/common';
import { Order, OrderItem } from '@pos-app/models';
import { STRIPE } from '../lib';
import Stripe from 'stripe';

@Injectable()
export class PaymentListener {
  constructor(
    @Inject(STRIPE)
    private readonly stripe: Stripe
  ) {}

  @RabbitSubscribe({
    exchange: 'order.created',
    routingKey: '#',
    queue: 'payment.charge-order',
  })
  public async handleChargeOrder(
    event: Order & {
      items: OrderItem[];
    }
  ) {
    console.log('PAYMENT.CHARGE-ORDER EVENT:', event);
  }
}
