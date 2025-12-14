import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from '../../shared/schemas/entities/cart.entity';
import { CartItem } from '../../shared/schemas/entities/cart-item.entity';
import { ProductVariant } from '../../shared/schemas/entities/product-variant.entity';
import { Product } from '../../shared/schemas/entities/product.entity';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Cart, CartItem, ProductVariant, Product])],
  providers: [CartService],
  controllers: [CartController],
  
})
export class CartModule {}
