import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class ProductStock {
  @Prop({
    required: true,
    min: 0,
  })
  availableQuantity: number;

  @Prop({
    required: true,
    min: 0,
  })
  reservedQuantity: number;
}

export const ProductStockSchema = SchemaFactory.createForClass(ProductStock);
