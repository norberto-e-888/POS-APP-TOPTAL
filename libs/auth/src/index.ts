import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  createParamDecorator,
} from '@nestjs/common';
import { Request } from 'express';
import * as jwt from 'jsonwebtoken';

export class Authenticated implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const jwtCookie = request.cookies['jwt'];

    if (!jwtCookie) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    try {
      jwt.verify(jwtCookie, process.env['JWT_SECRET'] as string);
    } catch (error) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    return true;
  }
}

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

export type JWTPayload = { id: string };
