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

  @Column({ name: 'total_amount', type: 'decimal', precision: 15, scale: 2 })
  totalAmount: number;

  @Column()
  status: string;

  @Column({ name: 'payment_method' })
  paymentMethod: string;

  @Column({ name: 'shipping_address_id' })
  shippingAddressId: string;

  @Column({ name: 'shipping_fee', type: 'decimal', precision: 15, scale: 2, default: 0 })
  shippingFee: number;

  @Column({ name: 'ghn_order_code', type: 'varchar', length: 100, nullable: true })
  ghnOrderCode: string | null;

  @Column({ name: 'ghn_status', type: 'varchar', length: 50, nullable: true })
  ghnStatus: string | null;

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
