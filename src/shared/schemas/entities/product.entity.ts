import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/schemas/base.entity';
import { Category } from './category.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductImage } from './product-image.entity';
import { FlashSale } from './flash-sale.entity';
import { FlashSaleItem } from './flash-sale-item.entity';

@Entity('products')
export class Product extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column()
  brand: string;

  @Column({ name: 'category_id' })
  categoryId: string;

  @Column({ default: 'ACTIVE' })
  status: string;

  @Column({ default: false })
  hasVariants: boolean;
  @OneToMany(() => FlashSale, flashSale => flashSale.product)
flashSales: FlashSale[];

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @OneToMany(() => ProductVariant, variant => variant.product)
  variants: ProductVariant[];

  @OneToMany(() => ProductImage, image => image.product)
  images: ProductImage[];
}
