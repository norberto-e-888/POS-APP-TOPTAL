import { OutboxPublisherModule } from '@pos-app/outbox';
import { AuthModelsModule } from '@pos-app/models';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

import { AuthService } from '../services';
import { BcryptProvider, JWTProvider, StripeProvider } from '../lib';
import { Config, config } from '../config';
import { AmqpModule } from './amqp';
import { AuthController } from '../controllers/auth.controller';

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
    AuthModelsModule,
    AmqpModule,
    OutboxPublisherModule,
  ],
  providers: [BcryptProvider, JWTProvider, AuthService, StripeProvider],
  controllers: [AuthController],
})
export class AppModule {}
