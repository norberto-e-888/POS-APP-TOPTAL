import { IsEmail, IsString, MinLength } from 'class-validator';
import { Trim } from 'class-sanitizer';

export class SignUpBody {
  @Trim()
  @IsString()
  firstName: string;

  @Trim()
  @IsString()
  lastName: string;

  @Trim()
  @IsEmail()
  @IsString()
  email: string;

  @Trim()
  @MinLength(8)
  @IsString()
  password: string;

  @Trim()
  @MinLength(8)
  @IsString()
  confirmPassword: string;
}
