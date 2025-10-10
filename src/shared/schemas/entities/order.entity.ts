import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/schemas/base.entity';
import { User } from '../../../shared/schemas/entities/user.entity';
import { Address } from './address.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from '../entities/payment.entity';

@Entity('orders')
export class Order extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'total_amount', type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column()
  status: string;

  @Column({ name: 'payment_method' })
  paymentMethod: string;

  @Column({ name: 'shipping_address_id' })
  shippingAddressId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Address)
  @JoinColumn({ name: 'shipping_address_id' })
  shippingAddress: Address;

  @OneToMany(() => OrderItem, (item) => item.order)
  items: OrderItem[];

  @OneToMany(() => Payment, (payment) => payment.order)
  payments: Payment[];
}
