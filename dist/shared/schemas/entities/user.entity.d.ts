import { BaseEntity } from '../base.entity';
import { Role } from './role.entity';
export declare class User extends BaseEntity {
    name: string;
    email: string;
    passwordHash: string;
    roles: Role[];
}
export { Role };
