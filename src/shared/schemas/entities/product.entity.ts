import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../shared/schemas/base.entity';
import { Category } from './category.entity';
import { Brand } from './brand.entity';
import { ProductVariant } from './product-variant.entity';
import { ProductImage } from './product-image.entity';
import { FlashSale } from './flash-sale.entity';
import { FlashSaleItem } from './flash-sale-item.entity';
import { User } from './user.entity';

@Entity('products')
export class Product extends BaseEntity {
  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ name: 'cost_price', type: 'decimal', precision: 10, scale: 2, nullable: true })
  costPrice: number;

  @Column({ nullable: true })
  brand: string; // Giữ lại để backward compatibility

  @Column({ name: 'brand_id', nullable: true })
  brandId: string;

  @Column({ name: 'category_id' })
  categoryId: string;

  @Column({ default: 'ACTIVE' })
  status: string;

  @Column({ default: false })
  hasVariants: boolean;

  @Column({ default: 0 })
  stock: number;

  @Column({ type: 'text', nullable: true })
  image: string; // Thêm field image để lưu URL ảnh chính

  @Column({ name: 'seller_id', nullable: true })
  sellerId: string; // ID của seller sở hữu sản phẩm

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'seller_id' })
  seller: User; // Quan hệ với User (seller)

  @OneToMany(() => FlashSale, flashSale => flashSale.product)
flashSales: FlashSale[];

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @ManyToOne(() => Brand, { nullable: true })
  @JoinColumn({ name: 'brand_id' })
  brandEntity: Brand;

  @OneToMany(() => ProductVariant, variant => variant.product)
  variants: ProductVariant[];

  @OneToMany(() => ProductImage, image => image.product)
  images: ProductImage[];
}
