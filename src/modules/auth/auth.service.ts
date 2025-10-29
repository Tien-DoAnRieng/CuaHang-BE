import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  OnApplicationBootstrap,
  Logger,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { MailerService } from '@nestjs-modules/mailer';
import { randomInt } from 'crypto';
import { addMinutes, isBefore } from 'date-fns';
import { ConfigService } from '@nestjs/config';
import { User } from '../../shared/schemas/entities/user.entity';
import { Role } from '../../shared/schemas/entities/role.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';
import { RoleEnum } from '../../common/enums/role.enum';
import { UserOtpLog } from '../../shared/schemas/entities/user-otp-log.entity';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(UserOtpLog) private otpLogRepo: Repository<UserOtpLog>,
    private jwtService: JwtService,
    private mailerService: MailerService,
    private configService: ConfigService,
  ) {}

  /** ✅ Tự động tạo role mặc định và admin từ .env khi app khởi động */
  async onApplicationBootstrap() {
    // 1️⃣ Tạo role mặc định
    const roles = Object.values(RoleEnum) as string[];
    for (const roleName of roles) {
      const exist = await this.roleRepo.findOne({ where: { name: roleName } });
      if (!exist) {
        await this.roleRepo.save(this.roleRepo.create({ name: roleName }));
        this.logger.log(`✅ Default role "${roleName}" created.`);
      }
    }

    // 2️⃣ Tạo admin mặc định từ .env
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

  /** ✅ Đăng ký user mặc định là customer */
  async register(dto: RegisterUserDto) {
    const exist = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exist) throw new BadRequestException('Email đã được sử dụng');

    const role = await this.roleRepo.findOne({ where: { name: RoleEnum.CUSTOMER } });
    if (!role) throw new BadRequestException('Vai trò mặc định chưa được tạo');

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
    const otpExpiresAt = addMinutes(new Date(), 10);
    await this.userRepo.update(newUser.id, { otp, otpExpiresAt });

    await this.mailerService.sendMail({
      to: newUser.email,
      subject: 'Mã xác thực tài khoản',
      template: 'verify-email',
      context: { name: newUser.name, otp },
    });

    return { message: 'Đăng ký thành công, vui lòng kiểm tra email để lấy mã xác thực' };
  }

  /** ✅ Xác thực email bằng OTP */
  async verifyEmail(email: string, otp: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new BadRequestException('Không tìm thấy tài khoản');

    if (user.isVerified) return { message: 'Tài khoản đã xác thực trước đó' };
    if (!user.otp || !user.otpExpiresAt) throw new BadRequestException('Không có mã xác thực');
    if (user.otp !== otp) throw new BadRequestException('Mã xác thực không đúng');
    if (isBefore(user.otpExpiresAt, new Date())) throw new BadRequestException('Mã xác thực đã hết hạn');

    user.isVerified = true;
    user.otp = null;
    user.otpExpiresAt = null;
    await this.userRepo.save(user);

    return { message: 'Xác thực thành công' };
  }

 

  /** ✅ Đăng nhập user */
  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      relations: ['role'],
    });

    if (!user) throw new UnauthorizedException('Email không tồn tại');
    if (!user.isVerified) throw new UnauthorizedException('Tài khoản chưa xác thực email');

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Mật khẩu không đúng');

    const payload = { sub: user.id, roles: [user.role.name] };
    const secret = this.configService.get<string>('JWT_SECRET');
    const token = this.jwtService.sign(payload, { secret });

    const { passwordHash, otp, otpExpiresAt, ...result } = user;
    return { access_token: token, user: result };
  }

  /** ✅ Admin cập nhật quyền người dùng */
  async updateUserRole(adminId: string, userId: string, newRoleName: RoleEnum)
{
    const admin = await this.userRepo.findOne({ where: { id: adminId }, relations: ['role'] });
    if (!admin || admin.role.name !== RoleEnum.ADMIN) {
      throw new ForbiddenException('Chỉ admin mới có thể chỉnh quyền');
    }

    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['role'] });
    if (!user) throw new BadRequestException('Không tìm thấy người dùng');

    const newRole = await this.roleRepo.findOne({ where: { name: newRoleName } });
    if (!newRole) throw new BadRequestException('Vai trò không hợp lệ');

    user.role = newRole;
    await this.userRepo.save(user);

    return { message: `Đã đổi quyền của ${user.email} thành ${newRoleName}` };
  }
}
