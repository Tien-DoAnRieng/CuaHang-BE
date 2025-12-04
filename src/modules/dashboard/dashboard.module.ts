import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Order } from '../../shared/schemas/entities/order.entity';
import { User } from '../../shared/schemas/entities/user.entity';
import { Product } from '../../shared/schemas/entities/product.entity';
import { Category } from '../../shared/schemas/entities/category.entity';
import { OrderItem } from '../../shared/schemas/entities/order-item.entity';
import { Payment } from 'src/shared/schemas/entities/payment.entity';
import { ProductImage } from 'src/shared/schemas/entities/product-image.entity';
import { ProductVariant } from 'src/shared/schemas/entities/product-variant.entity';
import { Address } from 'src/shared/schemas/entities/address.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, User, Product, Category, OrderItem, Payment, ProductImage, ProductVariant, Address])
],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}

