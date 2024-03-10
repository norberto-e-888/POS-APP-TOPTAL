import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { Order, OrderStatus } from '@pos-app/models';
import Stripe from 'stripe';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class OrderListener {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<Order>
  ) {}

  @RabbitSubscribe({
    exchange: 'payment.checkout-completed',
    routingKey: '#',
    queue: `order.set-order-status.${OrderStatus.PROCESSING}`,
  })
  async handleSetOrderStatusProcessing(event: Stripe.Checkout.Session) {
    console.log('ORDER.SET-ORDER-STATUS EVENT:', event);

    await this.orderModel.findByIdAndUpdate(event.metadata.mongoId, {
      status: OrderStatus.PROCESSING,
    });

    console.log(
      'SUCCESSFULLY UPDATED ORDER STATUS TO PROCESSING',
      event.metadata.mongoId
    );

    return new Nack(false);
  }
}
