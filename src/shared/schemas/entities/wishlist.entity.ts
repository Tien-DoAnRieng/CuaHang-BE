
import { Column, Entity, JoinColumn, ManyToOne, CreateDateColumn } from 'typeorm';
import { User } from '../../schemas/entities/user.entity';
import { Product } from '../../schemas/entities/product.entity';


@Entity('wishlists')
export class Wishlist {
  @Column({ name: 'user_id', primary: true })
  userId: string;

  @Column({ name: 'product_id', primary: true })
  productId: string;


  @CreateDateColumn({ name: 'created_at' })

  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
