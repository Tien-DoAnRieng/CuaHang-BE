import { Column, Entity, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../base.entity';
import { User } from './user.entity';
import { Order } from './order.entity';

export type CashbackType = 'EARNED' | 'SPENT' | 'EXPIRED' | 'REVOKED';
export type CashbackStatus = 'PENDING' | 'AVAILABLE' | 'CANCELLED';

@Entity('cashback_transactions')
export class CashbackTransaction extends BaseEntity {
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Order, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'order_id' })
  order: Order | null;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: ['EARNED', 'SPENT', 'EXPIRED', 'REVOKED'], default: 'EARNED' })
  type: CashbackType;

  @Column({ type: 'enum', enum: ['PENDING', 'AVAILABLE', 'CANCELLED'], default: 'PENDING' })
  status: CashbackStatus;

  @Column({ type: 'datetime', nullable: true, name: 'available_at' })
  availableAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  note: string | null;

  constructor(partial?: Partial<CashbackTransaction>) {
    super();
    Object.assign(this, partial);
  }
}
