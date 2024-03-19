import { Logger, Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ManagementClient } from 'auth0';

const logger = new Logger('AUTH0');

export const AUTH0 = Symbol('AUTH0');
export const Auth0Provider: Provider = {
  provide: AUTH0,
  inject: [ConfigService],
  useFactory: (config: ConfigService<Auth0RequiredConfig>) => {
    const {
      domain,
      admin: { clientId, clientSecret },
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    } = config.get<Auth0RequiredConfig['auth0']>('auth0')!;

    try {
      const client = new ManagementClient({
        domain,
        clientId,
        clientSecret,
      });

      return client;
    } catch (error) {
      logger.error(error, 'Error creating Auth0 client');
      logger.error({ domain, clientId }, 'Instantiating with');
      throw error;
    }
  },
};

export type Auth0 = ManagementClient;
export type Auth0RequiredConfig = {
  auth0: {
    domain: string;
    admin: {
      clientId: string;
      clientSecret: string;
    };
  };
};
