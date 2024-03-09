import { Provider } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

export const BCRYPT = Symbol('BCRYPT');

export const BcryptProvider: Provider = {
  provide: BCRYPT,
  useFactory: () => bcrypt,
};

export type BCRYPT = typeof bcrypt;
