import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { JWT, BCRYPT, STRIPE } from '../lib';
import { SignInBody, SignUpBody } from '../validators';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { Model } from 'mongoose';
import {
  CustomerStatus,
  USER_MODEL_COLLECTION,
  User,
  UserRole,
} from '@pos-app/models';
import { OutboxService } from '@pos-app/outbox';
import { Exchange } from '../app/amqp';
import { Config } from '../config';
import { ConfigService } from '@nestjs/config';
import { JWTPayload } from '@pos-app/auth';
import { Nack, RabbitRPC, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import Stripe from 'stripe';

@Injectable()
export class AuthService {
  constructor(
    @Inject(JWT)
    private readonly jwt: JWT,
    @Inject(BCRYPT)
    private readonly bcrypt: BCRYPT,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    private readonly outboxService: OutboxService,
    private readonly configService: ConfigService<Config>,
    @Inject(STRIPE) private readonly stripe: Stripe
  ) {}

  async signUp(dto: SignUpBody, admin?: boolean) {
    const existingUser = await this.userModel.findOne({
      email: dto.email,
    });

    if (existingUser) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    const isPasswordConfirmed = dto.password === dto.confirmPassword;

    if (!isPasswordConfirmed) {
      throw new HttpException('Passwords do not match', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await this.bcrypt.hash(dto.password, 10);

    return this.outboxService.publish(
      async (session) => {
        const [user] = await this.userModel.create(
          [
            {
              firstName: dto.firstName,
              lastName: dto.lastName,
              email: dto.email,
              password: hashedPassword,
              roles: admin ? [UserRole.ADMIN] : [UserRole.CUSTOMER],
              customerStatus: CustomerStatus.REGISTERED,
            },
          ],
          { session }
        );

        const userObj = user.toObject();

        return { user: userObj, jwt: this.signJwt(user) };
      },
      {
        exchange: Exchange.SignUp,
        routingKey: admin ? UserRole.ADMIN : UserRole.CUSTOMER,
      },
      {
        aggregate: {
          collection: USER_MODEL_COLLECTION,
          entityIdKey: 'id',
        },
        transformPayload: (result) => result.user,
      }
    );
  }

  async signIn(dto: SignInBody) {
    const user = await this.userModel.findOne({ email: dto.email });

    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.BAD_REQUEST);
    }

    const isPasswordValid = await this.bcrypt.compare(
      dto.password,
      user.password
    );

    if (!isPasswordValid) {
      throw new HttpException('Invalid credentials', HttpStatus.BAD_REQUEST);
    }

    return { user: user.toObject(), jwt: this.signJwt(user) };
  }

  async getUserById(id: string) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    return user.toObject();
  }

  @RabbitRPC({
    exchange: Exchange.CreateOrGetUser,
    routingKey: '',
    queue: 'auth.handle-create-or-get-user',
  })
  protected async handleCreateOrGetUser(msg: { email: string }) {
    const existingUser = await this.userModel.findOne({
      email: msg.email,
    });

    if (existingUser && existingUser.stripeId) {
      return existingUser.toObject();
    }

    const user = existingUser
      ? existingUser
      : await this.userModel.create({
          email: msg.email,
          roles: [UserRole.CUSTOMER],
          customerStatus: CustomerStatus.UNREGISTERED,
        });

    let {
      data: [customer],
    } = await this.stripe.customers.list({
      email: msg.email,
    });

    if (!customer) {
      customer = await this.stripe.customers.create({
        email: msg.email,
        metadata: {
          mongoId: user.id,
        },
      });
    }

    await this.userModel.findByIdAndUpdate(user.id, {
      stripeId: customer.id,
    });

    return user.toObject();
  }

  @RabbitSubscribe({
    exchange: Exchange.SignUp,
    routingKey: UserRole.CUSTOMER,
    queue: 'auth.create-customer',
  })
  protected async handleCreateCustomer(event: User) {
    try {
      console.log('AUTH.CREATE-CUSTOMER EVENT:', event);

      let {
        data: [customer],
      } = await this.stripe.customers.list({
        email: event.email,
      });

      if (!customer) {
        customer = await this.stripe.customers.create({
          email: event.email,
          name: `${event.firstName} ${event.lastName}`,
          metadata: {
            mongoId: event.id,
          },
        });
      }

      await this.userModel.findByIdAndUpdate(event.id, {
        stripeId: customer.id,
      });

      console.log('STRIPE CUSTOMER: ', customer);

      return new Nack(false);
    } catch (error) {
      console.log('AUTH.CREATE-CUSTOMER ERROR: ', error);
      return new Nack(false);
    }
  }

  private signJwt(user: HydratedDocument<User>) {
    const jwtSecret = this.configService.get<Config['jwt']>('jwt').secret;
    const payload: JWTPayload = {
      id: user.id,
      roles: user.roles,
    };

    return this.jwt.sign(payload, jwtSecret, {
      expiresIn: 60 * 60 * 24,
    });
  }
}
