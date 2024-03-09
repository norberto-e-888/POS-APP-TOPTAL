import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Config, config } from '../config';
import { MongooseModule } from '@nestjs/mongoose';
import { PaymentModelsModule } from '@pos-app/models';

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
  ],
  providers: [],
  controllers: [],
})
export class AppModule {}
