import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../../../shared/schemas/entities/user.entity';
import { Product } from '../entities/product.entity';

@Entity('wishlists')
export class Wishlist {
  @Column({ name: 'user_id', primary: true })
  userId: string;

  @Column({ name: 'product_id', primary: true })
  productId: string;

  @Column({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
