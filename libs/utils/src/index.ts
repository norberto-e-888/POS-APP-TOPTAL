import { SchemaOptions } from '@nestjs/mongoose';
import {
  CallbackWithoutResultAndOptionalError,
  Collection,
  Document,
  Types,
} from 'mongoose';
import { Coordinates, Pagination } from '@pos-app/validators';
import { Point } from '@pos-app/models';
import { TransformFnParams } from 'class-transformer';

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

export const schemaOptions = (
  collection: string,
  options: Omit<
    SchemaOptions,
    'collection' | 'id' | 'timestamps' | 'toObject'
  > = {}
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
