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
    private readonly customerAggregationModel: Model<CustomerAggregation>,
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
        const updatedOrder = await this.orderModel.findByIdAndUpdate(
          event.metadata.mongoId,
          {
            status: OrderStatus.PROCESSING,
          },
          { session, new: true }
        );

        return updatedOrder.toObject();
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
    try {
      console.log('ORDER.UPDATE-CUSTOMER-AGGREGATION EVENT:', event);

      const order = await this.orderModel.findById(event.metadata.mongoId);

      const customerAggregation = await this.customerAggregationModel.findOne({
        customerId: order.customerId,
      });

      console.log('ORDER', order);

      if (!customerAggregation) {
        console.log('CREATING NEW CUSTOMER AGGREGATION');
        await this.customerAggregationModel.create({
          numberOfPayments: 1,
          totalAmount: order.total,
          averageAmount: order.total,
          productFrequency: this.updateProductFrequency(order),
          customerId: order.customerId,
        });

        return new Nack(false);
      }

      customerAggregation.numberOfPayments += 1;
      customerAggregation.totalAmount += order.total;
      customerAggregation.averageAmount =
        customerAggregation.totalAmount / customerAggregation.numberOfPayments;

      customerAggregation.productFrequency = this.updateProductFrequency(
        order,
        customerAggregation.productFrequency
      );

      const doc = await customerAggregation.save();
      console.log('UPDATED CUSTOMER AGGREGATION', doc.toObject());
      return new Nack(false);
    } catch (error) {
      console.log('ERROR WITH ORDER.UPDATE-CUSTOMER-AGGREGATION', error);
      return new Nack(false);
    }
  }

  private updateProductFrequency(
    order: Order,
    defaultProductFrequency = new Map()
  ) {
    const productFrequency = order.items.reduce((acc, item) => {
      const productId = item.productId.toString();
      if (acc.has(productId)) {
        acc.set(productId, acc.get(productId) + item.quantity);
      } else {
        acc.set(productId, item.quantity);
      }

      return acc;
    }, defaultProductFrequency);

    return productFrequency;
  }
}
