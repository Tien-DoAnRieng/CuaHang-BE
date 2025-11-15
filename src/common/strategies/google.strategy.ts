import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, StrategyOptions } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../shared/schemas/entities/user.entity';
import { Role } from '../../shared/schemas/entities/role.entity';
import { RoleEnum } from '../enums/role.enum';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {
    const options: StrategyOptions = {
  clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
  clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
  callbackURL: 'http://localhost:3000/auth/google/callback',
  scope: ['email', 'profile'],
};

    super(options); // ✅ Truyền kiểu chính xác
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { name, emails } = profile;
    const email = emails[0].value;

    let user = await this.userRepository.findOne({ where: { email } });

    if (!user) {
      let defaultRole = await this.roleRepository.findOne({
        where: { name: RoleEnum.CUSTOMER },
      });

      if (!defaultRole) {
        defaultRole = this.roleRepository.create({
          name: RoleEnum.CUSTOMER,
        });
        await this.roleRepository.save(defaultRole);
      }

      user = this.userRepository.create({
        name: `${name.givenName} ${name.familyName}`,
        email,
        passwordHash: null,
        role: defaultRole,
        isVerified: true,
      });

      await this.userRepository.save(user);
    }

    done(null, user);
  }
}
