import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../shared/schemas/base.entity';
import { FlashSale } from './flash-sale.entity';
import { Product } from '../../../shared/schemas/entities/product.entity';
import { ProductVariant } from '../../../shared/schemas/entities/product-variant.entity';

@Entity('flash_sale_items')
export class FlashSaleItem extends BaseEntity {
  @Column({ name: 'flash_sale_id' })
  flashSaleId: string;

  @Column({ name: 'product_id' })
  productId: string;

  @Column({ name: 'product_variant_id' })
  productVariantId: string;

  @Column({ type: 'decimal', precision: 10, scale: 0 })
  salePrice: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountPercent?: number;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'text', nullable: true })       // <-- Thêm note
  note?: string;

  @ManyToOne(() => FlashSale, fs => fs.items)
  @JoinColumn({ name: 'flash_sale_id' })
  flashSale: FlashSale;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @ManyToOne(() => ProductVariant)
  @JoinColumn({ name: 'product_variant_id' })
  productVariant: ProductVariant;
}
