import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/schemas/base.entity';
import { FlashSaleItem } from './flash-sale-item.entity';
import { Product } from './product.entity';

@Entity('flash_sales')
export class FlashSale extends BaseEntity {
  @Column()
  title: string;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({ default: true })
  isActive: boolean;

  // Quan hệ với Product
  @Column({ name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, product => product.flashSales)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @OneToMany(() => FlashSaleItem, item => item.flashSale)
  items: FlashSaleItem[];
}
