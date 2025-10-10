import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../../shared/schemas/entities/product.entity';
import { Category } from '../../shared/schemas/entities/category.entity';
import { Color } from '../../shared/schemas/entities/color.entity';
import { Size } from '../../shared/schemas/entities/size.entity';
import { ProductVariant } from '../../shared/schemas/entities/product-variant.entity';
import { ProductImage } from '../../shared/schemas/entities/product-image.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Category,
      Color,
      Size,
      ProductVariant,
      ProductImage,
    ]),
  ],
  exports: [TypeOrmModule],
})
export class ProductModule {}
