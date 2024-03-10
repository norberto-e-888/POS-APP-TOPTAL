import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsMongoId,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { toInt, trim } from '@pos-app/utils';

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

export class OrderItemValidator {
  @IsMongoId()
  @Transform(trim)
  @IsString()
  productId: string;

  @Min(1)
  @IsInt()
  @Transform(toInt)
  @IsNumber()
  quantity: number;
}

export class CreateOrderBody {
  @IsObject()
  @ValidateNested()
  @Type(() => ShippingAddress)
  @IsOptional()
  shippingAddress?: ShippingAddress;

  @ArrayMinSize(1)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemValidator)
  items: OrderItemValidator[];
}

export class AddShippingAddressBody {
  @IsObject()
  @ValidateNested()
  @Type(() => ShippingAddress)
  shippingAddress: ShippingAddress;
}

export class AddItemBody {
  @IsObject()
  @ValidateNested()
  @Type(() => OrderItemValidator)
  item: OrderItemValidator;
}

export class RemoveItemBody {
  @IsMongoId()
  @Transform(trim)
  @IsString()
  productId: string;
}

export class UpdateItemBody {
  @IsMongoId()
  @Transform(trim)
  @IsString()
  productId: string;

  @Min(1)
  @IsInt()
  @Transform(toInt)
  @IsNumber()
  quantity: number;
}

export class PlaceOrderBody {
  @IsBoolean()
  @IsOptional()
  overrideIdempotency?: boolean;
}
