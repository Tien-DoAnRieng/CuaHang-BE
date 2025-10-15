// src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
// Sử dụng type của Role name (string)
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
