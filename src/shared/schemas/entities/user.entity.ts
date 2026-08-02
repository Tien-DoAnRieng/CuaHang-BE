import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/schemas/base.entity';
import { Role } from './role.entity';
import { MemberType } from './member-type.entity';

@Entity('users')
export class User extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255, nullable: true })
  passwordHash: string | null;

  // ✅ Một user chỉ có 1 role
  @ManyToOne(() => Role, { eager: true }) 
  @JoinColumn({ name: 'role_id' })
  role: Role;

  // ✅ Hạng thành viên hiện tại
  @ManyToOne(() => MemberType, { eager: true, nullable: true })
  @JoinColumn({ name: 'member_type_id' })
  memberType: MemberType | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'total_spent' })
  totalSpent: number;

  @Column({ type: 'int', default: 0, name: 'completed_orders_count' })
  completedOrdersCount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'cashback_balance' })
  cashbackBalance: number;

  @Column({ type: 'datetime', nullable: true, name: 'tier_updated_at' })
  tierUpdatedAt: Date | null;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ name: 'is_blocked', type: 'boolean', default: false })
  isBlocked: boolean;

  @Column({ type: 'varchar', length: 6, nullable: true })
  otp: string | null;

  @Column({ type: 'datetime', nullable: true })
  otpExpiresAt: Date | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ type: 'enum', enum: ['MALE', 'FEMALE', 'OTHER'], nullable: true })
  gender: 'MALE' | 'FEMALE' | 'OTHER' | null;

  @Column({ type: 'date', name: 'date_of_birth', nullable: true })
  dateOfBirth: Date | null;

  constructor(partial?: Partial<User>) {
    super();
    Object.assign(this, partial);
  }
}

