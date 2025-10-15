import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../shared/schemas/base.entity';
import { Product } from './product.entity';
import { ProductVariant } from './product-variant.entity';

@Entity('product_images')
export class ProductImage extends BaseEntity {
  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'variant_id', nullable: true })
  variantId?: string;

  @Column({ name: 'image_url', type: 'text' })
  imageUrl: string;

  @Column({ name: 'is_main', default: false })
  isMain: boolean;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => ProductVariant)
  @JoinColumn({ name: 'variant_id' })
  variant?: ProductVariant;
}