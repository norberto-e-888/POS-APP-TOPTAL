import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

import { AppModule } from './app/app.module';
import { ConfigService } from '@nestjs/config';
import { Config } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const cookieSecret = configService.get<Config['cookie']>('cookie').secret;

  app.use(cookieParser(cookieSecret));

  const port = configService.get<Config['misc']>('misc').port;
  await app.listen(port);

  Logger.log(`🚀 Auth service is running on: http://localhost:${port}`);
}

bootstrap();
