import { IsEmail, IsString, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { trim } from '@pos-app/utils';

export class SignUpBody {
  @Transform(trim)
  @IsString()
  firstName: string;

  @Transform(trim)
  @IsString()
  lastName: string;

  @Transform(trim)
  @IsEmail()
  @IsString()
  email: string;

  @Transform(trim)
  @MinLength(8)
  @IsString()
  password: string;

  @Transform(trim)
  @MinLength(8)
  @IsString()
  confirmPassword: string;
}
