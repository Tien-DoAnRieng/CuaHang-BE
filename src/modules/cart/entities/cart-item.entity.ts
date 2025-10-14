import { Entity, Column, JoinColumn, ManyToOne } from 'typeorm';
import { Cart } from './cart.entity';
import { ProductVariant } from '../../product/entities/product-variant.entity';

@Entity('cart_items')
export class CartItem {
  @Column({ name: 'cart_id', primary: true })
  cartId: string;

  @Column({ name: 'variant_id', primary: true })
  variantId: string;

  @Column()
  quantity: number;

  @ManyToOne(() => Cart)
  @JoinColumn({ name: 'cart_id' })
  cart: Cart;

  @ManyToOne(() => ProductVariant)
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;
}