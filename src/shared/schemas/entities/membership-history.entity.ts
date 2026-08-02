import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { User } from './user.entity';
import { MemberType } from './member-type.entity';

@Entity('membership_histories')
export class MembershipHistory extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => MemberType, { nullable: true, eager: true })
  @JoinColumn({ name: 'old_member_type_id' })
  oldMemberType: MemberType | null;

  @ManyToOne(() => MemberType, { eager: true })
  @JoinColumn({ name: 'new_member_type_id' })
  newMemberType: MemberType;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'spent_amount' })
  spentAmount: number;

  @Column({ type: 'int', default: 0, name: 'order_count' })
  orderCount: number;

  @Column({ type: 'varchar', length: 100, default: 'UPGRADE', name: 'change_reason' })
  changeReason: string;

  constructor(partial?: Partial<MembershipHistory>) {
    super();
    Object.assign(this, partial);
  }
}
