import { RedisProvider } from '@pos-app/utils';
import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';

@Global()
@Module({
  providers: [RedisProvider, CacheService],
  exports: [CacheService],
})
export class CacheModule {}
