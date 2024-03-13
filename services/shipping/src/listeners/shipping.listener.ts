import { Nack, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { Order, OrderType } from '@pos-app/models';

@Injectable()
export class ShippingListener {
  @RabbitSubscribe({
    exchange: 'order.processing',
    routingKey: OrderType.ONLINE,
    queue: 'shipping.create-shipping-label',
  })
  async handleCreateShippingLabel(order: Order) {
    console.log('SHIPPING.CREATE-SHIPPING-LABEL EVENT:', order);
    return new Nack(false);
  }
}
