import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { Order } from '../../shared/schemas/entities/order.entity';
import { User } from '../../shared/schemas/entities/user.entity';
import { Product } from '../../shared/schemas/entities/product.entity';
import { Category } from '../../shared/schemas/entities/category.entity';
import { OrderItem } from '../../shared/schemas/entities/order-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, User, Product, Category, OrderItem])],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
