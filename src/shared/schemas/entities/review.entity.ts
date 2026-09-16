import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/schemas/base.entity';

import { User } from '../../../shared/schemas/entities/user.entity';

import { Product } from '../../schemas/entities/product.entity';

@Entity('reviews')
export class Review extends BaseEntity {
  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column()
  rating: number;

  @Column({ type: 'text' })
  comment: string;

  @Column({ 
    type: 'varchar', 
    length: 20, 
    default: 'pending',
    comment: 'Review status: pending, approved, violated'
  })
  status: 'pending' | 'approved' | 'violated';

  @Column({ type: 'text', nullable: true })
  reply: string;

  @Column({ type: 'datetime', nullable: true, name: 'reply_date' })
  replyDate: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
