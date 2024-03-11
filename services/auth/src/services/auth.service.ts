import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { JWT, BCRYPT } from '../lib';
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
import { RabbitRPC } from '@golevelup/nestjs-rabbitmq';

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
    private readonly configService: ConfigService<Config>
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
    exchange: Exchange.CreateOrGetdUser,
    routingKey: '#',
    queue: 'auth.create-or-get-user',
  })
  protected async handleCreateOrGetUser(msg: {
    email: string;
    stripeId: string;
  }) {
    const existingUser = await this.userModel.findOne({
      email: msg.email,
    });

    if (existingUser) {
      return existingUser;
    }

    const user = await this.userModel.create({
      email: msg.email,
      roles: [UserRole.CUSTOMER],
      customerStatus: CustomerStatus.UNREGISTERED,
      stripeId: msg.stripeId,
    });

    return user;
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
