import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { User } from '../../shared/schemas/entities/user.entity';
import { Role } from '../../shared/schemas/entities/role.entity';
import { JwtStrategy } from '../../common/strategies/jwt.strategy';
import { MailerModule } from '@nestjs-modules/mailer';
import { QueueModule } from '../queue/queue.module';
import { UserOtpLog } from '../../shared/schemas/entities/user-otp-log.entity';
import { GoogleStrategy } from '../../common/strategies/google.strategy';
import { redisStore } from 'cache-manager-ioredis-yet';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forFeature([User, Role, UserOtpLog]),

    PassportModule.register({ defaultStrategy: 'jwt' }),

    // -----------------------------
    // JWT
    // -----------------------------
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),

    // -----------------------------
    // Mailer
    // -----------------------------
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      },
      defaults: {
        from: '"No Reply" <noreply@nestjs.com>',
      },
      template: {
        dir: join(process.cwd(), 'src/modules/auth/templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),

    // -----------------------------
    // REDIS CACHE MODULE (đúng chỗ)
    // -----------------------------
    CacheModule.registerAsync({
      isGlobal: false,
      useFactory: async () => ({
        store: await redisStore({
          host: process.env.REDIS_HOST || '127.0.0.1',
          port: Number(process.env.REDIS_PORT) || 6379,      
        }),
      }),
    }),

    // -----------------------------
    UserModule,
    QueueModule,
  ],

  controllers: [AuthController],

  providers: [
    AuthService,
    JwtStrategy,
    GoogleStrategy,
  ],
})
export class AuthModule {}
