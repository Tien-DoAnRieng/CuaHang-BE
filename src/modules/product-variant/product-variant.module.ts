import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductVariant } from '../../shared/schemas/entities/product-variant.entity';
import { ProductVariantController } from './controllers/product-variant.controller';
import { ProductVariantService } from './services/product-variant.service';
import { Product } from '../../shared/schemas/entities/product.entity';
import { Category } from '../../shared/schemas/entities/category.entity';
import { FlashSaleItem } from '../../shared/schemas/entities/flash-sale-item.entity';
import { ProductModule } from '../product/product.module';
import { forwardRef } from '@nestjs/common';
@Module({
  imports: [
    TypeOrmModule.forFeature([ProductVariant, Product, Category, FlashSaleItem]),
       forwardRef(() => ProductModule), // <--- dấu phẩy rất quan trọng
  ],
  controllers: [ProductVariantController],
  providers: [ProductVariantService],
  exports: [ProductVariantService], // export service để module khác dùng
})
export class ProductVariantModule {}
