import { PaymentModelsModule } from '@pos-app/models';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { Config, config } from '../config';
import { PaymentListener } from '../listeners';
import { AmqpModule } from './amqp';
import { StripeProvider } from '../lib/stripe-client';
import { StripeController } from '../controllers';
import { JsonBodyMiddleware, RawBodyMiddleware } from '../lib';

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
    PaymentModelsModule,
    AmqpModule,
  ],
  providers: [PaymentListener, StripeProvider],
  controllers: [StripeController],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RawBodyMiddleware)
      .forRoutes({
        path: '/stripe-webhook',
        method: RequestMethod.POST,
      })
      .apply(JsonBodyMiddleware)
      .forRoutes('*');
  }
}
