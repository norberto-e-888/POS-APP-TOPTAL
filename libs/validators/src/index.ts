import { Transform } from 'class-transformer';
import { IsInt, IsNumber, Min } from 'class-validator';

export class Coordinates {
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 6 })
  latitude!: number;

  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 6 })
  longitude!: number;
}

export class Pagination {
  @IsInt()
  @Transform(({ value }) => Number(value))
  @IsNumber({ allowNaN: false, allowInfinity: false })
  page!: number;

  @Min(1)
  @IsInt()
  @Transform(({ value }) => Number(value))
  @IsNumber({ allowNaN: false, allowInfinity: false })
  size!: number;
}
