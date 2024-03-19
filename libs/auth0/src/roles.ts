import {
  CanActivate,
  ExecutionContext,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from './user';

export enum Role {
  Admin = 'admin',
  PartnerRoot = 'partner-root',
  PartnerAdmin = 'partner-admin',
  RestaurantAdmin = 'restaurant-admin',
  Driver = 'driver',
  Diner = 'diner',
  Unassigned = 'unassigned',
}

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest() as {
      user: User;
    };

    if (
      !request.user['https://delivery-app.dev/app_metadata'].role ||
      request.user['https://delivery-app.dev/app_metadata'].role ===
        Role.Unassigned
    ) {
      return false;
    }

    const restrictTo = this.reflector.get<Role[]>(
      'roles',
      context.getHandler()
    );

    if (!restrictTo) {
      return true;
    }

    return restrictTo.includes(
      request.user['https://delivery-app.dev/app_metadata'].role
    );
  }
}
