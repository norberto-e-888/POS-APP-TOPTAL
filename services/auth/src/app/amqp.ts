import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config';

export enum Exchange {
  SignUp = 'auth.sign-up',
  CreateOrGetUser = 'auth.create-or-get-user',
  GetUser = 'auth.get-user',
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
