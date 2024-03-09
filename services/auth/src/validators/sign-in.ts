import { trim } from '@pos-app/utils';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class SignInBody {
  @Transform(trim)
  @IsEmail()
  @IsString()
  email: string;

  @Transform(trim)
  @MinLength(8)
  @IsString()
  password: string;
}
