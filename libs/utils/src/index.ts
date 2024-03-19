import { SchemaOptions } from '@nestjs/mongoose';
import {
  CallbackWithoutResultAndOptionalError,
  Collection,
  Document,
  Types,
} from 'mongoose';
import { Coordinates, Pagination } from '@pos-app/validators';
import { TransformFnParams } from 'class-transformer';
import { Prop, Schema } from '@nestjs/mongoose';
import { Schema as _Schema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Provider } from '@nestjs/common';
import { createClient } from 'redis';

@Schema({
  _id: false,
})
export class Point {
  @Prop({
    enum: ['Point'],
    default: 'Point',
  })
  type!: 'Point';

  @Prop({
    type: [_Schema.Types.Decimal128, _Schema.Types.Decimal128],
    transform: (v: [Types.Decimal128, Types.Decimal128]) =>
      v.map((decimal) => parseFloat(decimal.toString())),
  })
  coordinates!: [number, number];
}

export class BaseModel {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: Date })
  createdAt!: Date;

  @ApiProperty({ type: Date })
  updatedAt!: Date;
}

const SKIP_FROM_REF_INTEGRITY_CHECK = new Set([
  '_id',
  '__v',
  'createdAt',
  'updatedAt',
]);

export async function ensureRefIntegrity(
  this: Document,
  next: CallbackWithoutResultAndOptionalError
) {
  for (const path of Object.keys(this.schema.paths)) {
    if (SKIP_FROM_REF_INTEGRITY_CHECK.has(path)) {
      continue;
    }

    const ref = this.schema.path(path);

    if (!ref.options['ref']) {
      continue;
    }

    const parent = this.$parent();
    const collectionName = ref.options['ref'];
    const collection = parent
      ? parent.db.collection(collectionName)
      : this.db.collection(collectionName);

    if (!collection) {
      throw new Error(
        `Document can't be created because collection "${collectionName}" does not exist.`
      );
    }

    if (ref.instance === 'ObjectId') {
      await checkDocExists(collection, this.get(path));
    } else if (ref.instance === 'Array') {
      const ids: (Types.ObjectId | string)[] = this.get(path);
      for (const id of ids) {
        if (!Types.ObjectId.isValid(id)) {
          throw new Error(`"${path}" contains invalid ObjectId ${id}`);
        }

        await checkDocExists(collection, id);
      }
    } else {
      throw new Error(
        'Model properties with "ref" must be of type "ObjectId", "Array<ObjectId>".'
      );
    }
  }

  next();
}

async function checkDocExists(
  collection: Collection,
  _id: Types.ObjectId | string
) {
  if (typeof _id === 'string') {
    _id = new Types.ObjectId(_id);
  }

  const referencedDoc = await collection.findOne({
    _id,
  });

  if (!referencedDoc) {
    throw new Error(
      `Document can't be created because document with Id "${_id}" does not exist in collection "${collection.name}".`
    );
  }
}

export const schemaOptions = <M extends BaseModel>(
  collection: string,
  options: Omit<
    SchemaOptions,
    'collection' | 'id' | 'timestamps' | 'toObject'
  > & {
    omitFromTransform?: (keyof M)[];
  } = {}
): SchemaOptions => ({
  ...options,
  collection,
  id: true,
  timestamps: true,
  toObject: {
    virtuals: true,
    getters: true,
    transform: (_, ret: Record<string, unknown>) => ({
      ...ret,
      _id: undefined,
      __v: undefined,
      ...(options.omitFromTransform || []).reduce(
        (toOmit, keyToOmit) => ({
          ...toOmit,
          [keyToOmit]: undefined,
        }),
        {}
      ),
    }),
  },
});

export const coordinatesToPoint = ({
  longitude,
  latitude,
}: Coordinates): Point => ({
  type: 'Point',
  coordinates: [longitude, latitude],
});

export const defaultPagination = (pagination?: Pagination): Pagination =>
  pagination || {
    page: 1,
    size: 10,
  };

export const validateEnumArray = (
  enumType: Record<string, string>,
  errorMessage = 'Invalid enum array.'
) => ({
  validator: (v: string[]) =>
    v.every((s) => Object.values(enumType).includes(s)),
  message: errorMessage,
});

export const trim = ({ value }: TransformFnParams) => value.trim();
export const lowercase = ({ value }: TransformFnParams) => value.toLowerCase();
export const toInt = ({ value }: TransformFnParams) => parseInt(value, 10);

const toNDecimalFloat =
  (decimals: number) =>
  ({ value }: TransformFnParams) =>
    parseFloat(value).toFixed(decimals);

export const toTwoDecimalFloat = toNDecimalFloat(2);

export const REDIS = Symbol('REDIS');
export const RedisProvider: Provider = {
  provide: REDIS,
  inject: [ConfigService],
  useFactory: async (config: ConfigService<RedisRequiredConfig>) => {
    const { url } = config.get<RedisRequiredConfig['redis']>(
      'redis'
    ) as RedisRequiredConfig['redis'];

    const redis = createClient({ url });

    await redis.connect();

    return redis;
  },
};

export type Redis = ReturnType<typeof createClient>;
export interface RedisRequiredConfig {
  redis: {
    url: string;
  };
}
