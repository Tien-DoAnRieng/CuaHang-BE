import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FlashSale } from '../../shared/schemas/entities/flash-sale.entity';
import { FlashSaleItem } from '../../shared/schemas/entities/flash-sale-item.entity';
import { FlashSaleService } from './flash-sale.service';
import { FlashSaleController } from './flash-sale.controller';
import { Product } from '../../shared/schemas/entities/product.entity';
import { ProductVariant } from '../../shared/schemas/entities/product-variant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FlashSale, FlashSaleItem,Product,ProductVariant])],
  controllers: [FlashSaleController],
  providers: [FlashSaleService],
  exports: [FlashSaleService],
})
export class FlashSaleModule {}
