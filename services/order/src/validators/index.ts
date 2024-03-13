import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsEnum,
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
import { Pagination } from '@pos-app/validators';
import { OrderStatus, ProductCategory } from '@pos-app/models';
import { ApiProperty } from '@nestjs/swagger';

class ShippingAddress {
  @ApiProperty()
  @Transform(trim)
  @IsString()
  street: string;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  city: string;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  state: string;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  zip: string;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  country: string;
}

export class OrderItemValidator {
  @ApiProperty()
  @IsMongoId()
  @Transform(trim)
  @IsString()
  productId: string;

  @ApiProperty()
  @Min(1)
  @IsInt()
  @Transform(toInt)
  @IsNumber()
  quantity: number;
}

export class CreateOrderBody {
  @ApiProperty({ type: ShippingAddress })
  @IsObject()
  @ValidateNested()
  @Type(() => ShippingAddress)
  @IsOptional()
  shippingAddress?: ShippingAddress;

  @ApiProperty({ type: [OrderItemValidator] })
  @ArrayMinSize(1)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemValidator)
  items: OrderItemValidator[];
}

export class CreateAdminOrderBody {
  @ApiProperty({ type: ShippingAddress })
  @IsObject()
  @ValidateNested()
  @Type(() => ShippingAddress)
  @IsOptional()
  shippingAddress?: ShippingAddress;

  @ApiProperty({ type: [OrderItemValidator] })
  @ArrayMinSize(1)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemValidator)
  items: OrderItemValidator[];

  @ApiProperty()
  @Transform(trim)
  @IsEmail()
  @IsString()
  customerEmail: string;
}

export class AddShippingAddressBody {
  @ApiProperty({ type: ShippingAddress })
  @IsObject()
  @ValidateNested()
  @Type(() => ShippingAddress)
  shippingAddress: ShippingAddress;
}

export class AddItemBody {
  @ApiProperty({ type: OrderItemValidator })
  @IsObject()
  @ValidateNested()
  @Type(() => OrderItemValidator)
  item: OrderItemValidator;
}

export class RemoveItemBody {
  @ApiProperty()
  @IsMongoId()
  @Transform(trim)
  @IsString()
  productId: string;
}

export class UpdateItemBody {
  @ApiProperty()
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
  @ApiProperty()
  @IsBoolean()
  @IsOptional()
  overrideIdempotency?: boolean;
}

export class OrdersQuery {
  @ApiProperty({ type: Pagination })
  @IsObject()
  @ValidateNested()
  @Type(() => Pagination)
  @IsOptional()
  pagination?: Pagination;

  @ApiProperty({ enum: Object.values(OrderStatus) })
  @IsEnum(OrderStatus)
  @Transform(trim)
  @IsString()
  @IsOptional()
  status?: OrderStatus;

  @ApiProperty({ enum: ['createdAt'] })
  @Transform(trim)
  @IsString()
  @IsOptional()
  sortByField?: string;

  @ApiProperty({ enum: ['asc', 'desc'] })
  @Transform(trim)
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}

export class CreateProductBody {
  @ApiProperty()
  @Transform(trim)
  @IsString()
  name: string;

  @ApiProperty()
  @Transform(trim)
  @IsString()
  description: string;

  @ApiProperty()
  @Min(0.01)
  @IsNumber()
  price: number;

  @ApiProperty({ enum: Object.values(ProductCategory) })
  @IsEnum(ProductCategory)
  @IsString()
  category: ProductCategory;
}

export class AddProductStockBody {
  @ApiProperty()
  @Min(1)
  @IsInt()
  @Transform(toInt)
  @IsNumber()
  quantity: number;
}

export class ProductsQuery {
  @ApiProperty({ type: Pagination })
  @IsObject()
  @ValidateNested()
  @Type(() => Pagination)
  @IsOptional()
  pagination?: Pagination;

  @ApiProperty({ enum: ['createdAt'] })
  @Transform(trim)
  @IsString()
  @IsOptional()
  sortByField?: string;

  @ApiProperty({ enum: ['asc', 'desc'] })
  @Transform(trim)
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';

  @ApiProperty({ enum: Object.values(ProductCategory) })
  @IsEnum(ProductCategory)
  @Transform(trim)
  @IsString()
  @IsOptional()
  category?: ProductCategory;
}
