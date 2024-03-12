import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { CustomerAggregation, Order, OrderStatus } from '@pos-app/models';
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
    @InjectModel(CustomerAggregation.name)
    private readonly customerAggreagtionModel: Model<CustomerAggregation>,
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

  @RabbitSubscribe({
    exchange: 'payment.checkout-completed',
    routingKey: '#',
    queue: `order.update-customer-aggregation`,
  })
  async handlerUpdateCustomerAggregation(event: {
    metadata: {
      mongoId: string;
    };
  }) {
    console.log('ORDER.UPDATE-CUSTOMER-AGGREGATION EVENT:', event);

    const order = await this.orderModel.findById(event.metadata.mongoId);

    const customerAggregation = await this.customerAggreagtionModel.findById({
      customerId: order.customerId,
    });

    if (!customerAggregation) {
      await this.customerAggreagtionModel.create({
        customerId: order.customerId,
        numberOfPayments: 1,
        totalAmount: order.total,
        productFrequency: this.updateProductFrequency(order),
      });
      return new Nack(false);
    }

    customerAggregation.numberOfPayments += 1;
    customerAggregation.totalAmount += order.total;
    customerAggregation.productFrequency = this.updateProductFrequency(order);
  }

  private updateProductFrequency(order: Order) {
    const productFrequency = order.items.reduce((acc, item) => {
      if (acc[item.productId.toString()]) {
        acc[item.productId.toString()] += 1;
      } else {
        acc[item.productId.toString()] = 1;
      }
      return acc;
    }, {});

    return productFrequency;
  }
}
