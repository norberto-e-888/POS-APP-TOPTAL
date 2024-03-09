import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { CookieOptions, Response } from 'express';
import { AuthService } from '../services';
import { SignInBody, SignUpBody } from '../validators';
import { Authenticated, JWTPayload } from '@pos-app/auth';

const JWT_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
};

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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

  @UseGuards(Authenticated)
  @Post('sign-out')
  async handleSignOut(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('jwt', JWT_COOKIE_OPTIONS);

    return { message: 'You have been signed out.' };
  }

  @UseGuards(Authenticated)
  @Get('me')
  async handleMe(@JWTPayload() jwtPayload: JWTPayload) {
    return this.authService.getUserById(jwtPayload.id);
  }
}
