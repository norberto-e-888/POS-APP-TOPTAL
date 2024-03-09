import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { Order, OrderItem } from '@pos-app/models';

@Injectable()
export class PaymentListener {
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
