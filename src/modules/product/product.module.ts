import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Category } from './entities/category.entity';
import { Color } from './entities/color.entity';
import { Size } from './entities/size.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductImage } from './entities/product-image.entity';
import { ColorController } from './controllers/color.controller';
import { ColorService } from './services/color.service';
import { SizeController } from './controllers/size.controller';
import { SizeService } from './services/size.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Category,
      Color,
      Size,
      ProductVariant,

      ProductImage
    ])
  ],
  controllers: [ColorController, SizeController],
  providers: [ColorService, SizeService],
  exports: [TypeOrmModule]
})
export class ProductModule {}
