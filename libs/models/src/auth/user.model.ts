import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { schemaOptions, validateEnumArray, BaseModel } from '@pos-app/utils';
import { HydratedDocument } from 'mongoose';

export const USER_MODEL_COLLECTION = 'users';

export enum UserRole {
  ADMIN = 'admin',
  CUSTOMER = 'customer',
}

export enum CustomerStatus {
  REGISTERED = 'registered',
  UNREGISTERED = 'unregistered',
}

@Schema(
  schemaOptions<User>(USER_MODEL_COLLECTION, {
    omitFromTransform: ['password'],
  })
)
export class User extends BaseModel {
  @Prop({
    type: String,
    required: function (this: User) {
      return this.customerStatus === CustomerStatus.REGISTERED;
    },
  })
  firstName?: string;

  @Prop({
    type: String,
    required: function (this: User) {
      return this.customerStatus === CustomerStatus.REGISTERED;
    },
  })
  lastName?: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
  })
  email!: string;

  @Prop({
    type: String,
    required: function (this: User) {
      return this.customerStatus === CustomerStatus.REGISTERED;
    },
  })
  password?: string;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(CustomerStatus),
  })
  customerStatus!: CustomerStatus;

  @Prop({
    unique: true,
    sparse: true,
  })
  stripeId?: string;

  @Prop({
    type: [String],
    validate: validateEnumArray(UserRole, 'Invalid roles.'),
    default: UserRole.CUSTOMER,
  })
  roles!: UserRole[];
}

export const UserSchema = SchemaFactory.createForClass(User);

export type UserDocument = HydratedDocument<User>;
