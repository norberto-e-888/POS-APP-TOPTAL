import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response } from 'express';
import * as bodyParser from 'body-parser';

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: () => unknown) {
    bodyParser.raw({ type: '*/*' })(req, res, next);
  }
}
