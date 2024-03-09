import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  createParamDecorator,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class Authenticated implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const jwtCookie = request.cookies['jwt'];

    if (!jwtCookie) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    let payload: JWTPayload;
    try {
      payload = jwt.verify(
        jwtCookie,
        process.env['JWT_SECRET'] as string
      ) as JWTPayload;
    } catch (error) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const allowedRoles = this.reflector.get(Roles, context.getHandler());
    if (!allowedRoles || !allowedRoles.length) {
      return true;
    }

    return payload.roles.some((role) => allowedRoles.includes(role));
  }
}

export const Roles = Reflector.createDecorator<string[]>();

export const JWTPayload = createParamDecorator(
  (_: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const jwtCookie = request.cookies['jwt'];

    if (!jwtCookie) {
      return null;
    }

    try {
      return jwt.verify(jwtCookie, process.env['JWT_SECRET'] as string);
    } catch (error) {
      return null;
    }
  }
);

export type JWTPayload = { id: string; roles: string[] };
