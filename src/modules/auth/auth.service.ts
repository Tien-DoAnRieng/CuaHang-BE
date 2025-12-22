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

  /** ✅ Helper: Gửi email OTP với retry logic */
  private async sendOtpEmail(
    email: string, 
    name: string, 
    otp: string, 
    userId: string,
    expiresAt: Date,
    retries: number = 3
  ): Promise<boolean> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.logger.log(`📧 Attempting to send OTP email to ${email} (attempt ${attempt}/${retries})`);
        
        // Kiểm tra cấu hình mail
        const mailUser = process.env.MAIL_USER;
        const mailPassword = process.env.MAIL_PASSWORD;
        
        if (!mailUser || !mailPassword) {
          this.logger.error(`❌ Mail configuration missing: MAIL_USER=${!!mailUser}, MAIL_PASSWORD=${!!mailPassword}`);
          throw new Error('Mail configuration is missing. Please set MAIL_USER and MAIL_PASSWORD in .env file');
        }

        await this.mailerService.sendMail({
          to: email,
          subject: 'Mã xác thực tài khoản',
          template: 'verify-email',
          context: { name, otp },
        });
        
        this.logger.log(`✅ OTP email sent successfully to ${email}`);
        
        // Log OTP vào database để debug (optional) - với đầy đủ thông tin
        try {
          const user = await this.userRepo.findOne({ where: { id: userId } });
          if (user) {
            await this.otpLogRepo.save({
              user,
              otp,
              expiresAt,
              used: false,
              usedAt: null,
            });
            this.logger.log(`✅ OTP logged to database for ${email}`);
          }
        } catch (logError) {
          this.logger.warn(`⚠️ Failed to log OTP to database:`, logError);
          // Không throw error vì việc log không quan trọng bằng việc gửi email
        }
        
        return true;
      } catch (mailError: any) {
        this.logger.error(`❌ Failed to send OTP email to ${email} (attempt ${attempt}/${retries}):`, {
          error: mailError?.message || mailError,
          stack: mailError?.stack,
        });
        
        if (attempt === retries) {
          // Lần cuối cùng thất bại, log chi tiết
          this.logger.error(`❌ All ${retries} attempts failed. OTP: ${otp} for ${email}`);
          return false;
        }
        
        // Đợi 1 giây trước khi retry
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    return false;
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

    // Gửi email OTP với retry logic (truyền đầy đủ tham số)
    const emailSent = await this.sendOtpEmail(
      newUser.email, 
      newUser.name, 
      otp, 
      newUser.id, 
      otpExpiresAt
    );
    
    if (!emailSent) {
      // Nếu không gửi được email, vẫn lưu OTP vào DB để user có thể xem trong console/logs
      this.logger.warn(`⚠️ OTP for ${newUser.email}: ${otp} (Email sending failed, but OTP is saved in database)`);
      // Có thể throw error hoặc trả về OTP trong response để debug (chỉ trong development)
      if (process.env.NODE_ENV === 'development') {
        return { 
          message: 'Đăng ký thành công, nhưng không thể gửi email. OTP đã được lưu trong database.',
          otp: otp, // Chỉ trả về trong development
          email: newUser.email,
        };
      }
    }

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

  /** ✅ Helper: Tạo JWT token với format nhất quán */
  private createJwtToken(user: User): string {
    const roleName = user.role?.name || RoleEnum.CUSTOMER;
    const payload = {
      sub: user.id,
      email: user.email,
      roles: [roleName], // Luôn là array
      roleName: roleName, // Thêm roleName để dễ truy cập
    };
    const secret = this.configService.get<string>('JWT_SECRET');
    return this.jwtService.sign(payload, { secret });
  }

  /** ✅ Đăng nhập user */
  async login(dto: LoginDto) {
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      relations: ['role'],
    });

    if (!user) throw new UnauthorizedException('Email không tồn tại');
    if (!user.isVerified) throw new UnauthorizedException('Tài khoản chưa xác thực email');

    // ---- FIX: đảm bảo passwordHash không null trước khi bcrypt.compare
    if (!user.passwordHash) {
      // tài khoản này không có mật khẩu (ví dụ OAuth), không thể login bằng email/password
      throw new UnauthorizedException('Tài khoản này không dùng mật khẩu. Vui lòng đăng nhập bằng OAuth.');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Mật khẩu không đúng');

    // Sử dụng helper method để tạo token với format nhất quán
    const token = this.createJwtToken(user);

    const { passwordHash, otp, otpExpiresAt, ...result } = user;
    return { access_token: token, accessToken: token, user: result };
  }

  /** ✅ Admin/Seller cập nhật quyền người dùng */
  async updateUserRole(adminId: string, userId: string, newRoleName: RoleEnum) {
    const admin = await this.userRepo.findOne({ where: { id: adminId }, relations: ['role'] });
    if (!admin) {
      throw new ForbiddenException('Không tìm thấy người dùng');
    }
    
    const userRole = admin.role?.name?.toLowerCase();
    if (userRole !== RoleEnum.ADMIN.toLowerCase() && userRole !== RoleEnum.SELLER.toLowerCase()) {
      throw new ForbiddenException('Chỉ admin và seller mới có thể chỉnh quyền');
    }

    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['role'] });
    if (!user) throw new BadRequestException('Không tìm thấy người dùng');

    const newRole = await this.roleRepo.findOne({ where: { name: newRoleName } });
    if (!newRole) throw new BadRequestException('Vai trò không hợp lệ');

    user.role = newRole;
    await this.userRepo.save(user);

    return { message: `Đã đổi quyền của ${user.email} thành ${newRoleName}` };
  }

  async sendResetPasswordOtp(email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new BadRequestException('Không tìm thấy người dùng với email này');

    const otp = randomInt(100000, 999999).toString();
    const expiresAt = addMinutes(new Date(), 10);

    // Lưu OTP vào bảng user_otp_logs
    await this.otpLogRepo.save(
      this.otpLogRepo.create({ user, otp, expiresAt, used: false })
    );

    // Gửi mail OTP
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Mã đặt lại mật khẩu',
      template: 'reset-password', // 📁 src/modules/auth/templates/reset-password.hbs
      context: { name: user.name, otp },
    });

    return { message: 'Mã OTP đặt lại mật khẩu đã được gửi đến email của bạn' };
  }

  /** ✅ Xác minh OTP quên mật khẩu */
  async verifyResetPasswordOtp(email: string, otp: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new BadRequestException('Không tìm thấy người dùng');

    const otpRecord = await this.otpLogRepo.findOne({
      where: { user: { id: user.id }, otp, used: false },
      order: { createdAt: 'DESC' },
    });
    if (!otpRecord) throw new BadRequestException('Mã OTP không hợp lệ');
    if (isBefore(otpRecord.expiresAt, new Date())) throw new BadRequestException('Mã OTP đã hết hạn');

    otpRecord.used = true;
    otpRecord.usedAt = new Date();
    await this.otpLogRepo.save(otpRecord);

    return { message: 'Xác minh OTP thành công, bạn có thể đặt lại mật khẩu' };
  }

  /** ✅ Đặt lại mật khẩu mới */
  async resetPassword(email: string, newPassword: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user) throw new BadRequestException('Không tìm thấy người dùng');

    const hash = await bcrypt.hash(newPassword, 10);
    user.passwordHash = hash;

    await this.userRepo.save(user);
    return { message: 'Đặt lại mật khẩu thành công' };
  }

  /** Google OAuth login */
  async googleLogin(req: any) {
    if (!req.user) return { message: 'No user from Google' };

    const { email, name = 'Google User' } = req.user;

    // 🔍 Tìm user trong DB
    let user = await this.userRepo.findOne({ where: { email }, relations: ['role'] });

    // 🧱 Nếu chưa có → tạo mới
    if (!user) {
      let defaultRole = await this.roleRepo.findOne({
        where: { name: RoleEnum.CUSTOMER },
      });

      if (!defaultRole) {
        defaultRole = this.roleRepo.create({ name: RoleEnum.CUSTOMER });
        await this.roleRepo.save(defaultRole);
      }

      user = this.userRepo.create({
        email,
        name,
        passwordHash: '', // Google login không cần mật khẩu (hoặc null)
        isVerified: true,
        role: defaultRole,
      });

      await this.userRepo.save(user);
    }

    // 🪪 Sử dụng helper method để tạo token với format nhất quán
    const token = this.createJwtToken(user);

    return {
      message: 'Google login success',
      user,
      accessToken: token,
      access_token: token,
    };
  }
}
