import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/schemas/base.entity';
import { Order } from './order.entity';

@Entity('payments')
export class Payment extends BaseEntity {
  @Column({ name: 'order_id' })
  orderId: string;
 

  @Column({ name: 'payment_method', nullable: true })
  paymentMethod: string;

  @Column()
  status: string;

  @Column({ name: 'payment_time', type: 'timestamp', nullable: true  })
  paymentTime: Date;

 @ManyToOne(() => Order, order => order.payments)
  @JoinColumn({ name: 'order_id' })
  order: Order;



}

