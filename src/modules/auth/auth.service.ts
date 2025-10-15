import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  OnApplicationBootstrap,
  Logger, // Import Logger
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../../shared/schemas/entities/user.entity';
import { Role } from '../../shared/schemas/entities/role.entity';
import { RegisterUserDto } from './dto/register-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuthService.name); // Instantiate Logger

  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    private jwtService: JwtService,
  ) {}

  // This function will run once the application has started
  async onApplicationBootstrap() {
    const customerRole = await this.roleRepo.findOne({ where: { name: 'customer' } });
    if (!customerRole) {
      this.logger.log('Default role "customer" not found. Creating it...');
      const newRole = this.roleRepo.create({ name: 'customer' });
      await this.roleRepo.save(newRole);
      this.logger.log('Default role "customer" created.');
    }
  }

  async register(dto: RegisterUserDto) {
    const exist = await this.userRepo.findOne({ where: { email: dto.email } });
    if (exist) throw new BadRequestException('Email đã được sử dụng');

    const defaultRole = await this.roleRepo.findOne({
      where: { name: 'customer' },
    });
    if (!defaultRole)
      throw new BadRequestException('Vai trò mặc định chưa được tạo');

    const hash = await bcrypt.hash(dto.password, 10);

    const newUser = this.userRepo.create({
      name: dto.name,
      email: dto.email,
      passwordHash: hash,
      roles: [defaultRole],
    });

    await this.userRepo.save(newUser);

    return { message: 'Đăng ký thành công', user: newUser };
  }

  async login(dto: LoginDto) {
    this.logger.log(`Login attempt for email: ${dto.email}`);
    const user = await this.userRepo.findOne({
      where: { email: dto.email },
      relations: ['roles'],
    });

    this.logger.log('User object found in DB:', JSON.stringify(user, null, 2));

    if (!user) {
      this.logger.warn(`Login failed: User not found for email ${dto.email}`);
      throw new UnauthorizedException('Email không tồn tại');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) {
      this.logger.warn(`Login failed: Invalid password for email ${dto.email}`);
      throw new UnauthorizedException('Mật khẩu không đúng');
    }

    this.logger.log(`Login successful for: ${dto.email}`);
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles.map((r) => r.name),
    };

    const token = this.jwtService.sign(payload);

    // Avoid sending back sensitive info like password hash
    const { passwordHash, ...result } = user;
    return { access_token: token, user: result };
  }
}
