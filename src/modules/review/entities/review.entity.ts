import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/schemas/base.entity';
import { User } from '../../user/entities/user.entity';
import { Product } from '../../product/entities/product.entity';

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

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}