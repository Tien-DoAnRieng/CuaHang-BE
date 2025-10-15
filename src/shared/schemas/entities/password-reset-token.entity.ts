import { Column, Entity, JoinColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/schemas/base.entity';
import { User } from '../../schemas/entities/user.entity';

@Entity('password_reset_tokens')
export class PasswordResetToken extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ unique: true })
  token: string;

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Column({ default: false })
  used: boolean;
  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}