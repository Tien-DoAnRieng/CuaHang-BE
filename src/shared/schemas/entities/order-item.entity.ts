import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Order } from '../entities/order.entity';
import { ProductVariant } from '../entities/product-variant.entity';

@Entity('order_items')
export class OrderItem {
  @Column({ name: 'order_id', primary: true })
  orderId: string;

  @Column({ name: 'variant_id', primary: true })
  variantId: string;

  @Column()
  quantity: number;

  @Column({ name: 'price_at_time', type: 'decimal', precision: 10, scale: 2 })
  priceAtTime: number;

  @ManyToOne(() => Order)
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @ManyToOne(() => ProductVariant)
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;
}
