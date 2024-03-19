import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from './roles';

export const User = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest().user
);

export interface User<R extends Role = Role.Unassigned> {
  'https://delivery-app.dev/app_metadata': UserAppMetadata & { role: R };
  'https://delivery-app.dev/user_metadata': unknown;
  'https://delivery-app.dev/is_email_verified': boolean;
  iss: string;
  sub: string;
  aud: string;
  iat: number;
  exp: number;
  azp: string;
  gty: string;
}

export type UserAppMetadata = {
  role: Role;
} & (
  | {
      role: Role.Admin;
    }
  | {
      role: Role.PartnerRoot;
      partnerId: string;
    }
  | {
      role: Role.PartnerAdmin;
      partnerId: string;
    }
  | {
      role: Role.RestaurantAdmin;
      partnerId: string;
      restaurantId: string;
    }
  | {
      role: Role.Driver;
    }
  | {
      role: Role.Diner;
    }
  | {
      role: Role.Unassigned;
    }
);
