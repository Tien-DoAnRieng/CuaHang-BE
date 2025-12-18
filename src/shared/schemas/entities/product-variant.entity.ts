import { Column, Entity, JoinColumn, ManyToMany, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/schemas/base.entity';
import { Product } from './product.entity';
import { Color } from './color.entity';
import { Size } from './size.entity';

@Entity('product_variants')
export class ProductVariant extends BaseEntity {
  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'color_id' })
  colorId: string;

  @Column({ name: 'size_id', nullable: true })
  sizeId: string | null;

  @Column({ name: 'stock_quantity', type: 'int', default: 0 })
  stockQuantity: number;


  @Column({ name: 'price_override', type: 'decimal', precision: 10, scale: 2, nullable: true })

  priceOverride: number;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;
@ManyToOne(() => Color)
@JoinColumn({ name: 'color_id' })
color: Color;

@ManyToOne(() => Size, { nullable: true })
@JoinColumn({ name: 'size_id' })
size: Size | null;

}
