import { OutboxPublisherModule } from '@pos-app/outbox';
import { OrderModelsModule } from '@pos-app/models';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { Config, config } from '../config';
import { AmqpModule } from './amqp';
import { OrderService } from '../services';
import { OrderController } from '../controllers/order.controller';
import { OrderListener } from '../listeners';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService<Config>) => {
        const { uri } = configService.get<Config['mongo']>('mongo');

        return {
          uri,
        };
      },
    }),
    OrderModelsModule,
    AmqpModule,
    OutboxPublisherModule,
  ],
  providers: [OrderService, OrderListener],
  controllers: [OrderController],
})
export class AppModule {}
