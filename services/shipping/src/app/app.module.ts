import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { config } from '../config';
import { AmqpModule } from './amqp';
import { ShippingListener } from '../listeners';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [config],
    }),
    AmqpModule,
  ],
  providers: [ShippingListener],
})
export class AppModule {}
