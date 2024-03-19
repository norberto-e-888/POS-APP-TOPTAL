import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(readonly config: ConfigService<JwtStrategyRequiredConfig>) {
    const { jwksUri, audience, issuer } =
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      config.get<JwtStrategyRequiredConfig['auth0']>('auth0')!;

    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience,
      issuer,
      algorithms: ['RS256'],
    });
  }

  validate(payload: unknown): unknown {
    return payload;
  }
}

interface JwtStrategyRequiredConfig {
  auth0: {
    audience: string;
    issuer: string;
    jwksUri: string;
  };
}
