import { Global, Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategy';
import { AUTH0, Auth0Provider } from './client';

@Global()
@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [JwtStrategy, Auth0Provider],
  exports: [PassportModule, AUTH0],
})
export class Auth0Module {}

export * from './client';
export * from './email-verified';
export * from './roles';
export * from './user';
