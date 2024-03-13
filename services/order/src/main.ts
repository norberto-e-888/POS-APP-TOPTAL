import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';
import { Config } from './config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  CustomerAggregation,
  Order,
  OrderItem,
  OrderShippingAddress,
  Product,
  ProductStock,
} from '@pos-app/models';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('POS-APP Order Microservice API')
    .setVersion('1.0')
    .addTag(Order.name)
    .addTag(CustomerAggregation.name)
    .addTag(Product.name)
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [
      Order,
      CustomerAggregation,
      Product,
      ProductStock,
      OrderItem,
      OrderShippingAddress,
    ],
  });

  SwaggerModule.setup('api', app, document);

  const configService = app.get(ConfigService);
  const cookieSecret = configService.get<Config['cookie']>('cookie').secret;

  app.use(cookieParser(cookieSecret));
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  const port = configService.get<Config['misc']>('misc').port;
  await app.listen(port);

  Logger.log(`🚀 Order service is running on: http://localhost:${port}`);
}

bootstrap();
