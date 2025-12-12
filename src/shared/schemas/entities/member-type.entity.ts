import { Column, Entity } from 'typeorm';
import { BaseEntity } from '../base.entity';

@Entity('member_types')
export class MemberType extends BaseEntity {
  @Column({ unique: true })
  name: string; // potential, regular, occasional, new

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'int', default: 0 })
  minOrders?: number; // Số đơn hàng tối thiểu

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  minSpent?: number; // Tổng chi tiêu tối thiểu

  @Column({ type: 'int', default: 0 })
  discountPercent?: number; // Phần trăm giảm giá cho loại thành viên này
}

