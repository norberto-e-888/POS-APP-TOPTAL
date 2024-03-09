import {
  IsArray,
  IsDecimal,
  IsEnum,
  IsInt,
  IsMongoId,
  IsNumberString,
  IsObject,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { OrderStatus } from '../models';
import { toInt, toTwoDecimalFloat, trim } from '@pos-app/utils';

export class CreateOrderBody {
  @IsObject()
  @ValidateNested()
  @Type(() => ShippingAddress)
  shippingAddress: ShippingAddress;

  @IsEnum(OrderStatus)
  @Transform(trim)
  @IsString()
  status: OrderStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItem)
  items: OrderItem[];

  @Min(0.01)
  @IsDecimal()
  @Transform(toTwoDecimalFloat)
  @IsNumberString()
  @IsString()
  total: number;
}

class ShippingAddress {
  @Transform(trim)
  @IsString()
  street: string;

  @Transform(trim)
  @IsString()
  city: string;

  @Transform(trim)
  @IsString()
  state: string;

  @Transform(trim)
  @IsString()
  zip: string;

  @Transform(trim)
  @IsString()
  country: string;
}

class OrderItem {
  @IsMongoId()
  @Transform(trim)
  @IsString()
  productId: string;

  @Min(1)
  @IsInt()
  @Transform(toInt)
  @IsNumberString()
  @IsString()
  quantity: number;

  @Min(0.01)
  @IsDecimal()
  @Transform(toTwoDecimalFloat)
  @IsNumberString()
  @IsString()
  price: number;
}
