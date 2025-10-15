import { BaseEntity } from '../../../shared/schemas/base.entity';
import { User } from '../../../shared/schemas/entities/user.entity';
export declare class PasswordResetToken extends BaseEntity {
    userId: string;
    token: string;
    expiresAt: Date;
    used: boolean;
    user: User;
}
