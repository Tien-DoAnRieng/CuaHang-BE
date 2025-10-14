import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../../shared/schemas/entities/product.entity';
import { Category } from '../../shared/schemas/entities/category.entity';
import { Color } from '../../shared/schemas/entities/color.entity';
import { Size } from '../../shared/schemas/entities/size.entity';
import { ProductVariant } from '../../shared/schemas/entities/product-variant.entity';
import { ProductImage } from '../../shared/schemas/entities/product-image.entity';
import { ProductVariantModule } from '../product-variant/product-variant.module';
import { ProductImageModule } from '../product-image/product-image.module';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

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
    ProductVariantModule,
    ProductImageModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [TypeOrmModule, ProductVariantModule, ProductImageModule],
})
export class ProductModule {}
