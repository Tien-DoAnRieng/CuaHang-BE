import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Product } from '../../shared/schemas/entities/product.entity';
import { Category } from '../../shared/schemas/entities/category.entity';
import { Brand } from '../../shared/schemas/entities/brand.entity';
import { Color } from '../../shared/schemas/entities/color.entity';
import { Size } from '../../shared/schemas/entities/size.entity';
import { ProductVariant } from '../../shared/schemas/entities/product-variant.entity';
import { ProductImage } from '../../shared/schemas/entities/product-image.entity';
import { FlashSaleItem } from '../../shared/schemas/entities/flash-sale-item.entity';
import { FlashSale } from '../../shared/schemas/entities/flash-sale.entity';
import { OrderItem } from '../../shared/schemas/entities/order-item.entity';
import { Order } from '../../shared/schemas/entities/order.entity';
import { Review } from '../../shared/schemas/entities/review.entity';
import { User } from '../../shared/schemas/entities/user.entity';
import { CartItem } from '../../shared/schemas/entities/cart-item.entity';
import { Wishlist } from '../../shared/schemas/entities/wishlist.entity';

import { ProductVariantModule } from '../product-variant/product-variant.module';
import { ProductImageModule } from '../product-image/product-image.module';
import { FlashSaleModule } from '../flash-sale/flash-sale.module';

import { ProductController } from './controllers/product.controller';
import { ColorController } from './controllers/color.controller';
import { SizeController } from './controllers/size.controller';

import { ProductService } from './services/product.service';
import { ProductImportService } from './services/product-import.service';
import { ProductAnalyticsService } from './services/product-analytics.service';
import { ColorService } from './services/color.service';
import { SizeService } from './services/size.service';
import { ProductVariantService } from '../product-variant/services/product-variant.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Category,
      Brand,
      Color,
      Size,
      ProductVariant,
      ProductImage,
      FlashSale,
      FlashSaleItem,
      OrderItem,
      Order,
      Review,
      User,
      CartItem,
      Wishlist,
    ]),
    FlashSaleModule,
    ProductVariantModule,
    ProductImageModule,
  ],
  controllers: [
    ProductController,
    ColorController,
    SizeController,
  ],
  providers: [
    ProductService,
    ProductImportService,
    ProductAnalyticsService,
    ColorService,
    SizeService,
    ProductVariantService,
  ],
  exports: [
    ProductService,
    TypeOrmModule,
    ProductVariantService,
  ],
})
export class ProductModule {}
