import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/schemas/base.entity';
import { Role } from './role.entity';

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

  @Column({ default: false })
  isVerified: boolean;

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
