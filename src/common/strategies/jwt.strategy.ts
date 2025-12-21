import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../shared/schemas/entities/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    const secret = configService.get<string>('JWT_SECRET') || 'default_secret';
   

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: any) {
    // Kiểm tra user có bị block không - load với relation role để có đầy đủ thông tin
    const user = await this.userRepository.findOne({ 
      where: { id: payload.sub },
      relations: ['role'],
    });
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    if (user.isBlocked) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }
   
    // payload.sub = userId, payload.roles = ["admin", "seller", ...]
    // payload.roleName = "admin" (từ helper method createJwtToken)
    // Đảm bảo roles là array và có role từ database
    const roles = Array.isArray(payload.roles) ? payload.roles : (payload.roles ? [payload.roles] : []);
    const roleNameFromPayload = payload.roleName || roles[0];
    const roleName = user.role?.name || roleNameFromPayload || 'customer';
    
    // Đảm bảo roles array luôn có ít nhất 1 phần tử
    const finalRoles = roles.length > 0 ? roles : [roleName];
    
    // Trả về user object với đầy đủ thông tin role
    const userData = {
      id: payload.sub || user.id, // Ưu tiên payload.sub, fallback về user.id
      email: payload.email || user.email,
      roles: finalRoles, // Luôn là array
      role: user.role, // Role object đầy đủ từ database (có id, name, ...)
      roleName: roleName, // Role name string để dễ truy cập
    };
    
    // Debug logging
    console.log('[JwtStrategy.validate] User data:', {
      payloadSub: payload.sub,
      userId: user.id,
      finalId: userData.id,
      roles: finalRoles,
      roleName,
      userRoleFromDb: user.role?.name
    });
    
    return userData;
  }
}
