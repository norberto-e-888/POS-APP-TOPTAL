import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { JWT, BCRYPT } from '../lib';
import { SignUpBody } from '../validators';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { USER_MODEL_COLLECTION, User, UserRole } from '../models';
import { OutboxService } from '@pos-app/outbox';
import { Exchange } from '../app/amqp';
import { Config } from '../config';
import { ConfigService } from '@nestjs/config';

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

  async signUp(dto: SignUpBody) {
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

    const user = new this.userModel({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      password: hashedPassword,
      roles: [UserRole.USER],
    });

    return this.outboxService.publish(
      async (session) => {
        const savedUser = (await user.save({ session })).toObject();
        const jwtSecret = this.configService.get<Config['jwt']>('jwt').secret;
        const jwt = this.jwt.sign({ id: savedUser.id }, jwtSecret, {
          expiresIn: 60 * 60 * 24,
        });

        return { user: savedUser, jwt };
      },
      {
        exchange: Exchange.SignUp,
        routingKey: UserRole.USER,
      },
      {
        aggregate: {
          collection: USER_MODEL_COLLECTION,
          entityId: user.id,
        },
        transformPayload: (result) => result.user,
      }
    );
  }
}
