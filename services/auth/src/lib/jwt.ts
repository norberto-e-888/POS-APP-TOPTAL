import { Provider } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';

export const JWT = Symbol('JWT');

export const JWTProvider: Provider = {
  provide: JWT,
  useFactory: () => jwt,
};

export type JWT = typeof jwt;
