import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { User } from './user';

@Injectable()
export class EmailVerifiedGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest() as {
      user: User;
    };

    if (!request.user['https://delivery-app.dev/is_email_verified']) {
      throw new HttpException(
        'Your email must be verified to access this resource.',
        HttpStatus.FORBIDDEN
      );
    }

    return true;
  }
}
