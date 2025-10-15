// src/modules/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Lấy ra các Roles được yêu cầu bởi Decorator (@Roles)
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true; // Nếu không có decorator, cho phép truy cập
    }

    // 2. Lấy thông tin User từ Request (được gắn bởi JwtAuthGuard)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { user } = context.switchToHttp().getRequest();

    // 3. Kiểm tra User Role có nằm trong Required Roles không
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return requiredRoles.some((role) => user.role === role);
  }
}
