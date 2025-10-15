import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cart } from '../../shared/schemas/entities/cart.entity';
import { CartItem } from '../../shared/schemas/entities/cart-item.entity';

@Module({

  imports: [TypeOrmModule.forFeature([Cart, CartItem])],
  exports: [TypeOrmModule],
})
export class CartModule {}

