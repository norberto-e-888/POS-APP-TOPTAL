import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { schemaOptions, validateEnumArray, BaseModel } from '@pos-app/utils';
import { HydratedDocument } from 'mongoose';

export const USER_MODEL_COLLECTION = 'users';

export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
}

@Schema(
  schemaOptions<User>(USER_MODEL_COLLECTION, {
    omitFromTransform: ['password'],
  })
)
export class User extends BaseModel {
  @Prop({
    type: String,
    required: true,
  })
  firstName: string;

  @Prop({
    type: String,
    required: true,
  })
  lastName: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  email: string;

  @Prop({
    type: String,
    required: true,
  })
  password: string;

  @Prop({
    type: [String],
    validate: validateEnumArray(UserRole, 'Invalid roles.'),
    default: UserRole.CUSTOMER,
  })
  roles: UserRole[];
}

export const UserSchema = SchemaFactory.createForClass(User);

export type UserDocument = HydratedDocument<User>;
