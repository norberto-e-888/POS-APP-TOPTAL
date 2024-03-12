import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { Order, OrderStatus } from '@pos-app/models';
import Stripe from 'stripe';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { OutboxService } from '@pos-app/outbox';
import { Exchange } from '../app/amqp';

@Injectable()
export class OrderListener {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>,
    private readonly outboxService: OutboxService
  ) {}

  @RabbitSubscribe({
    exchange: 'payment.checkout-completed',
    routingKey: '#',
    queue: `order.set-order-status.${OrderStatus.PROCESSING}`,
  })
  async handleSetOrderStatusProcessing(event: Stripe.Checkout.Session) {
    console.log('ORDER.SET-ORDER-STATUS EVENT:', event);

    const order = await this.orderModel.findById(event.metadata.mongoId);

    await this.outboxService.publish(
      async (session) => {
        await this.orderModel.findByIdAndUpdate(
          event.metadata.mongoId,
          {
            status: OrderStatus.PROCESSING,
          },
          { session, new: true }
        );
      },
      {
        exchange: Exchange.OrderProcessing,
        routingKey: order.type,
      }
    );

    console.log(
      'SUCCESSFULLY UPDATED ORDER STATUS TO PROCESSING',
      event.metadata.mongoId
    );

    return new Nack(false);
  }
}
