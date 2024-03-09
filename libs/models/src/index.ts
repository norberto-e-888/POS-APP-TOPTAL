import { Prop, Schema } from '@nestjs/mongoose';
import { Schema as _Schema, Types } from 'mongoose';

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
  id!: string;
  createdAt!: Date;
  updatedAt!: Date;
}
