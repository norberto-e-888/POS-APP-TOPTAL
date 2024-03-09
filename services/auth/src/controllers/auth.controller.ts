import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from '../services';
import { SignUpBody } from '../validators';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sign-up')
  async handleSignUp(
    @Body() body: SignUpBody,
    @Res({ passthrough: true }) res: Response
  ) {
    const { jwt, user } = await this.authService.signUp(body);

    res.cookie('jwt', jwt, {
      httpOnly: true,
    });

    return user;
  }
}
