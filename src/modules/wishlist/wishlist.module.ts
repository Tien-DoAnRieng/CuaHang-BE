import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wishlist } from '../../shared/schemas/entities/wishlist.entity';
import { Product } from '../../shared/schemas/entities/product.entity';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Wishlist, Product])],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}
