import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ _id: false })
export class ProductStock {
  @ApiProperty({ minimum: 0 })
  @Prop({
    required: true,
    min: 0,
  })
  availableQuantity!: number;

  @ApiProperty({ minimum: 0 })
  @Prop({
    required: true,
    min: 0,
  })
  reservedQuantity!: number;
}

export const ProductStockSchema = SchemaFactory.createForClass(ProductStock);
