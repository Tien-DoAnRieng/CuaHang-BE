import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { User } from './user.entity';
import { Coupon } from './coupon.entity';

@Entity('user_vouchers')
export class UserVoucher extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Coupon, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'coupon_id' })
  coupon: Coupon;

  @Column({ type: 'boolean', default: false, name: 'is_used' })
  isUsed: boolean;

  @Column({ type: 'datetime', nullable: true, name: 'used_at' })
  usedAt: Date | null;

  @Column({ type: 'datetime', nullable: true, name: 'expires_at' })
  expiresAt: Date | null;

  @Column({ type: 'varchar', length: 50, default: 'TIER_REWARD' })
  source: string;

  constructor(partial?: Partial<UserVoucher>) {
    super();
    Object.assign(this, partial);
  }
}
