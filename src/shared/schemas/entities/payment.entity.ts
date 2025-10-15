import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/schemas/base.entity';
import { Order } from './order.entity';

@Entity('payments')
export class Payment extends BaseEntity {
  @Column({ name: 'order_id' })
  orderId: string;

  @Column({ name: 'payment_method' })
  paymentMethod: string;

  @Column()
  status: string;

  @Column({ name: 'payment_time' })
  paymentTime: Date;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;
}
