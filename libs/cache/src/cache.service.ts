import { Redis, REDIS } from '@pos-app/utils';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { inspect } from 'util';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(REDIS)
    private readonly redis: Redis
  ) {}

  set(key: string, data: Record<string, unknown> | Array<unknown>) {
    this.redis
      .set(key, JSON.stringify(data))
      .then(() => {
        this.logger.verbose(`Successfully wrote ${key} to cache`);
      })
      .catch((error) => {
        this.logger.error(inspect(error), `Error writing ${key} to cache`);
      });
  }

  setInBucket(
    bucket: string,
    key: string,
    data: Record<string, unknown> | Array<unknown>
  ) {
    this.redis
      .hSet(bucket, key, JSON.stringify(data))
      .then(() => {
        this.logger.verbose(
          `Successfully wrote bucket ${bucket} key ${key} to cache`
        );
      })
      .catch((error) => {
        this.logger.error(
          inspect(error),
          `Error writing bucket ${bucket} key ${key} to cache`
        );
      });
  }

  async get<T>(key: string) {
    try {
      const data = await this.redis.get(key);

      if (data) {
        this.logger.verbose(`Cache hit ${key}`);
        return JSON.parse(data) as T;
      }

      this.logger.verbose(`Cache miss ${key}`);
      return null;
    } catch (error) {
      this.logger.error(inspect(error));
      throw new HttpException(
        `Data held by key "${key}" could not be parsed to JSON!`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getFromBucket<T>(bucket: string, key: string) {
    try {
      const data = await this.redis.hGet(bucket, key);

      if (data) {
        this.logger.verbose(`Cache hit in bucket ${bucket} key ${key}`);
        return JSON.parse(data) as T;
      }

      this.logger.verbose(`Cache miss in bucket ${bucket} key ${key}`);
      return null;
    } catch (error) {
      this.logger.error(inspect(error));
      throw new HttpException(
        `Data held in bucket "${bucket}" by key "${key}" could not be parsed to JSON!`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async del(key: string | string[]) {
    if (Array.isArray(key)) {
      await Promise.all(key.map((k) => this.redis.del(k)));
    } else {
      await this.redis.del(key);
    }
  }
}
