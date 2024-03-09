import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Config, config } from '../config';
import { MongooseModule } from '@nestjs/mongoose';
import { ModelsModule } from '../models';
import { AmqpModule } from './amqp';
import { OutboxPublisherModule } from '@pos-app/outbox';
import { OrderService } from '../services';

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
    ModelsModule,
    AmqpModule,
    OutboxPublisherModule,
  ],
  providers: [OrderService],
  controllers: [],
})
export class AppModule {}
