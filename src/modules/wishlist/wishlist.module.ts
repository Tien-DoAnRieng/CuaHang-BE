import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wishlist } from '../../shared/schemas/entities/wishlist.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wishlist])
  ],
  exports: [TypeOrmModule]
})
export class WishlistModule {}
