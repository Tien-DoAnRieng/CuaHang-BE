import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { MailerService } from '@nestjs-modules/mailer';
import { randomInt } from 'crypto';
import { addMinutes } from 'date-fns';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { User } from '../../shared/schemas/entities/user.entity';
import { Role } from '../../shared/schemas/entities/role.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';
import { RoleEnum } from '../../common/enums/role.enum';
import { UserOtpLog } from '../../shared/schemas/entities/user-otp-log.entity';
import type { Cache } from 'cache-manager';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly OTP_TTL = 600; 

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(UserOtpLog) private otpLogRepo: Repository<UserOtpLog>,

    @Inject(CACHE_MANAGER) private cache: Cache,

    private jwtService: JwtService,
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}
 async onApplicationBootstrap() {
  const roles = Object.values(RoleEnum) as string[];
  for (const roleName of roles) {
    const exist = await this.roleRepo.findOne({ where: { name: roleName } });
    if (!exist) {
      await this.roleRepo.save(this.roleRepo.create({ name: roleName }));
      this.logger.log(`✅ Default role "${roleName}" created.`);
    }
  }
  const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
  const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

  if (!adminEmail || !adminPassword) {
    this.logger.warn('⚠️ ADMIN_EMAIL hoặc ADMIN_PASSWORD chưa được cấu hình trong .env');
    return;
  }

  const adminExist = await this.userRepo.findOne({ where: { email: adminEmail } });
  if (!adminExist) {
    const adminRole = await this.roleRepo.findOne({ where: { name: RoleEnum.ADMIN } });
    if (!adminRole) throw new Error('Vai trò admin chưa tồn tại');

    const hash = await bcrypt.hash(adminPassword, 10);
    const newAdmin = this.userRepo.create({
      name: 'Admin',
      email: adminEmail,
      passwordHash: hash,
      role: adminRole,
      isVerified: true,
    });

    await this.userRepo.save(newAdmin);
    this.logger.log(`✅ Admin account "${adminEmail}" created from .env`);
  }
}
  async register(dto: RegisterUserDto) {
    const exist = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exist) throw new BadRequestException('Email đã được sử dụng');

    const role = await this.roleRepo.findOne({
      where: { name: RoleEnum.CUSTOMER },
    });
    if (!role) throw new BadRequestException('Role CUSTOMER chưa tồn tại');

    const hash = await bcrypt.hash(dto.password, 10);

    const newUser = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash: hash,
      role,
      isVerified: false,
    });

    await this.userRepo.save(newUser);

    const otp = randomInt(100000, 999999).toString();
    await this.cache.set(`verify:${newUser.id}`, otp, this.OTP_TTL);

    await this.mailerService.sendMail({
      to: newUser.email,
      subject: 'Mã xác thực tài khoản',
      template: 'verify-email',
      context: { name: newUser.name, otp },
    });

    return { message: 'Đăng ký thành công. Vui lòng kiểm tra email để lấy mã xác thực.' };
  }
  async verifyEmail(email: string, otp: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new BadRequestException('Không tìm thấy tài khoản');
    if (user.isVerified) return { message: 'Tài khoản đã xác thực trước đó' };

    const savedOtp = await this.cache.get<string>(`verify:${user.id}`);
    if (!savedOtp) throw new BadRequestException('OTP đã hết hạn hoặc không tồn tại');
    if (savedOtp !== otp) throw new BadRequestException('OTP không đúng');

    await this.cache.del(`verify:${user.id}`);

    user.isVerified = true;
    await this.userRepo.save(user);

    await this.otpLogRepo.save(
      this.otpLogRepo.create({
        user,
        otp,
        used: true,
        usedAt: new Date(),
        expiresAt: addMinutes(new Date(), 10),
      }),
    );

    return { message: 'Xác thực email thành công' };
  }
  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      relations: ['role'],
    });

    if (!user) throw new UnauthorizedException('Email không tồn tại');
    if (!user.isVerified) throw new UnauthorizedException('Tài khoản chưa xác thực email');
    if (!user.passwordHash)
      throw new UnauthorizedException('Tài khoản này dùng OAuth, không thể đăng nhập bằng mật khẩu');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Mật khẩu không đúng');

    const payload = { sub: user.id, roles: [user.role.name] };
    const token = this.jwtService.sign(payload);

    const { passwordHash, ...cleanUser } = user;
    return { access_token: token, user: cleanUser };
  }
  async updateUserRole(adminId: string, userId: string, newRoleName: RoleEnum) {
    const admin = await this.userRepo.findOne({
      where: { id: adminId },
      relations: ['role'],
    });
    if (!admin || admin.role.name !== RoleEnum.ADMIN)
      throw new ForbiddenException('Chỉ admin được phép cập nhật quyền');

    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['role'],
    });
    if (!user) throw new BadRequestException('Không tìm thấy người dùng');

    const newRole = await this.roleRepo.findOne({
      where: { name: newRoleName },
    });
    if (!newRole) throw new BadRequestException(`Role ${newRoleName} không tồn tại`);

    user.role = newRole;
    await this.userRepo.save(user);

    return { message: `Đã đổi quyền của ${user.email} thành ${newRoleName}` };
  }
  async sendResetPasswordOtp(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new BadRequestException('Không tìm thấy người dùng');

    const otp = randomInt(100000, 999999).toString();
    await this.cache.set(`reset:${user.id}`, otp, this.OTP_TTL);

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Mã đặt lại mật khẩu',
      template: 'reset-password',
      context: { name: user.name, otp },
    });

    return { message: 'Mã OTP đã được gửi đến email của bạn' };
  }

  async verifyResetPasswordOtp(email: string, otp: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new BadRequestException('Không tìm thấy người dùng');

    const savedOtp = await this.cache.get<string>(`reset:${user.id}`);
    if (!savedOtp) throw new BadRequestException('OTP không hợp lệ');
    if (savedOtp !== otp) throw new BadRequestException('OTP không đúng');

    await this.cache.del(`reset:${user.id}`);

    await this.otpLogRepo.save(
      this.otpLogRepo.create({
        user,
        otp,
        used: true,
        usedAt: new Date(),
        expiresAt: addMinutes(new Date(), 10),
      }),
    );

    return { message: 'OTP hợp lệ. Bạn có thể đặt lại mật khẩu.' };
  }

  async resetPassword(email: string, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new BadRequestException('Không tìm thấy người dùng');

    const hash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hash;
    await this.userRepo.save(user);

    return { message: 'Đặt lại mật khẩu thành công' };
  }
  async googleLogin(req: any) {
    if (!req.user) return { message: 'Không có user từ Google' };

    const { email, name = 'Google User' } = req.user;

    let user = await this.userRepo.findOne({
      where: { email },
      relations: ['role'],
    });

    if (!user) {
      const role = await this.roleRepo.findOne({
        where: { name: RoleEnum.CUSTOMER },
      });
      if (!role) throw new BadRequestException('Role CUSTOMER chưa tồn tại');

      user = this.userRepo.create({
        email,
        name,
        passwordHash: '',
        isVerified: true,
        role,
      });

      await this.userRepo.save(user);
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role.name,
    });
    return {
      message: 'Google login success',
      user,
      accessToken: token,
      access_token: token,
    };
  }
}
