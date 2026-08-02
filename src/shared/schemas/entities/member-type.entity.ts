import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base.entity';

@Entity('member_types')
export class MemberType extends BaseEntity {
  @Column({ unique: true })
  name: string; // Member, Silver, Gold, Platinum, Diamond

  @Column({ type: 'varchar', length: 50, default: 'MEMBER' })
  code: string;

  @Column({ type: 'int', default: 1 })
  rankLevel: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', default: 0 })
  minOrders?: number; // Số đơn hàng tối thiểu

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  minSpent?: number; // Tổng chi tiêu tối thiểu

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  cashbackRate?: number; // Phần trăm hoàn tiền

  @Column({ type: 'int', default: 0 })
  discountPercent?: number; // Phần trăm giảm giá trực tiếp
}


