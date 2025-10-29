import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/schemas/base.entity';
import { User } from './user.entity';

@Entity('user_otp_logs')
export class UserOtpLog extends BaseEntity {
  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 6 })
  otp: string;

  @Column({ type: 'datetime' })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  used: boolean;

  @Column({ type: 'datetime', nullable: true })
  usedAt: Date | null;
}
