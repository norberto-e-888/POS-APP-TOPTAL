import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { CookieOptions, Response, Request } from 'express';
import { AuthService } from '../services';
import { SignInBody, SignUpBody } from '../validators';
import { JWT } from '../lib';
import { ConfigService } from '@nestjs/config';
import { Config } from '../config';

const JWT_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
};

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @Inject(JWT) private readonly jwt: JWT,
    private readonly configService: ConfigService<Config>
  ) {}

  @Post('sign-up')
  async handleSignUp(
    @Body() body: SignUpBody,
    @Res({ passthrough: true }) res: Response
  ) {
    const { jwt, user } = await this.authService.signUp(body);

    res.cookie('jwt', jwt, JWT_COOKIE_OPTIONS);

    return user;
  }

  @Post('sign-in')
  async handleSignIn(
    @Body() body: SignInBody,
    @Res({ passthrough: true }) res: Response
  ) {
    const { jwt, user } = await this.authService.signIn(body);

    res.cookie('jwt', jwt, JWT_COOKIE_OPTIONS);

    return user;
  }

  @Post('sign-out')
  async handleSignOut(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('jwt', JWT_COOKIE_OPTIONS);

    return { message: 'You have been signed out.' };
  }

  @Get('me')
  async handleMe(@Req() req: Request) {
    const jwt = req.cookies['jwt'];

    if (!jwt) {
      throw new HttpException('Unauthorized', HttpStatus.UNAUTHORIZED);
    }

    const jwtSecret = this.configService.get<Config['jwt']>('jwt').secret;
    const payload = this.jwt.verify(jwt, jwtSecret) as { id: string };

    return this.authService.getUserById(payload.id);
  }
}
