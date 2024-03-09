import { Module } from '@nestjs/common';
import { OutboxPublisherModule } from '@pos-app/outbox';
import { AuthService } from '../services';
import { BcryptProvider, JWTProvider } from '../lib';
import { ModelsModule } from '../models';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Config, config } from '../config';
import { MongooseModule } from '@nestjs/mongoose';
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
    ModelsModule,
    AmqpModule,
    OutboxPublisherModule,
  ],
  providers: [BcryptProvider, JWTProvider, AuthService],
  controllers: [AuthController],
})
export class AppModule {}
