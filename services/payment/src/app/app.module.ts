import { PaymentModelsModule } from '@pos-app/models';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { Config, config } from '../config';
import { PaymentListener } from '../listeners';
import { AmqpModule } from './amqp';

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
  providers: [PaymentListener],
  controllers: [],
})
export class AppModule {}
