import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    // Extract roles từ user object - hỗ trợ nhiều format
    let userRoles: string[] = [];
    if (Array.isArray(user.roles)) {
      userRoles = user.roles.map((r: any) => typeof r === 'string' ? r : (r.name || r));
    } else if (user.role) {
      // Nếu có role object
      const roleName = typeof user.role === 'string' ? user.role : (user.role.name || user.role);
      userRoles = [roleName];
    } else if (typeof user.roles === 'string') {
      userRoles = [user.roles];
    }

    if (userRoles.length === 0) return false;

    return requiredRoles.some(role => userRoles.includes(role));
  }
}
