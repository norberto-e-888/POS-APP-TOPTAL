import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config';

export enum Exchange {
  OrderCreated = 'order.created',
  OrderCancelled = 'order.cancelled',
  OrderPlaced = 'order.placed',
  OrderProcessing = 'order.processing',
}

@Global()
@Module({
  imports: [
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      inject: [ConfigService],
      useFactory: (config: ConfigService<Config>) => {
        const { url } = config.get<Config['amqp']>('amqp');
        return {
          uri: url,
          connectionInitOptions: { wait: true },
          exchanges: Object.values(Exchange).map((name) => ({
            name,
            type: 'topic',
          })),
        };
      },
    }),
  ],
  exports: [RabbitMQModule],
})
export class AmqpModule {}
