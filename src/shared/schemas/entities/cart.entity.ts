import { Entity, Column, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/schemas/base.entity';

import { User } from '../../../shared/schemas/entities/user.entity';

import { CartItem } from './cart-item.entity';
import { Payment } from './payment.entity';
@Entity('carts')
export class Cart extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;


  @OneToMany(() => CartItem, (cartItem: CartItem) => cartItem.cart)
  items: CartItem[];
  
  @OneToMany(() => Payment, payment => payment.order)
  payments: Payment[];
}
