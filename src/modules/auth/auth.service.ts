import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  OnApplicationBootstrap,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { MailerService } from '@nestjs-modules/mailer';
import { randomInt } from 'crypto';
import { addMinutes, isBefore } from 'date-fns';

import { User } from '../../shared/schemas/entities/user.entity';
import { Role } from '../../shared/schemas/entities/role.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    private jwtService: JwtService,
    private mailerService: MailerService,
  ) {}

  async onApplicationBootstrap() {
    const customerRole = await this.roleRepo.findOne({ where: { name: 'customer' } });
    if (!customerRole) {
      const newRole = this.roleRepo.create({ name: 'customer' });
      await this.roleRepo.save(newRole);
      this.logger.log('Default role "customer" created.');
    }
  }

  // ✅ Đăng ký: gửi mã OTP qua email
  async register(dto: RegisterUserDto) {
    const exist = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exist) throw new BadRequestException('Email đã được sử dụng');

    const role = await this.roleRepo.findOne({ where: { name: 'customer' } });
    if (!role) throw new BadRequestException('Vai trò mặc định chưa được tạo');

    const hash = await bcrypt.hash(dto.password, 10);

    const newUser = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash: hash,
      roles: [role],
      isVerified: false,
    });
    await this.userRepo.save(newUser);

    // ✅ Tạo mã OTP 6 chữ số
    const otp = randomInt(100000, 999999).toString();
    const otpExpiresAt = addMinutes(new Date(), 10);

    await this.userRepo.update(newUser.id, { otp, otpExpiresAt });

    // ✅ Gửi mail chứa mã OTP
    await this.mailerService.sendMail({
      to: newUser.email,
      subject: 'Mã xác thực tài khoản của bạn',
      template: 'verify-email', // verify-otp.hbs
      context: {
        name: newUser.name,
        otp,
      },
    });

    return { message: 'Đăng ký thành công, vui lòng kiểm tra email để lấy mã xác thực' };
  }

  // ✅ Xác thực OTP
  async verifyEmail(email: string, otp: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new BadRequestException('Không tìm thấy tài khoản');

    if (user.isVerified) return { message: 'Tài khoản đã xác thực trước đó' };

    if (!user.otp || !user.otpExpiresAt)
      throw new BadRequestException('Không có mã xác thực, vui lòng đăng ký lại');

    if (user.otp !== otp)
      throw new BadRequestException('Mã xác thực không đúng');

    if (isBefore(user.otpExpiresAt, new Date()))
      throw new BadRequestException('Mã xác thực đã hết hạn');

    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    await this.userRepo.save(user);

    return { message: 'Xác thực thành công' };
  }

  // ✅ Đăng nhập
  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      relations: ['roles'],
    });

    if (!user) throw new UnauthorizedException('Email không tồn tại');
    if (!user.isVerified)
      throw new UnauthorizedException('Tài khoản chưa xác thực email');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Mật khẩu không đúng');

    const payload = { sub: user.id, roles: user.roles.map((r) => r.name) };
    const token = this.jwtService.sign(payload);

    const { passwordHash, ...result } = user;
    return { access_token: token, user: result };
  }
}
