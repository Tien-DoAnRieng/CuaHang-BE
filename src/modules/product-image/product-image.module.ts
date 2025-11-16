import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductImage } from '../../shared/schemas/entities/product-image.entity';
import { ProductImageController } from './controllers/product-image.controller';
import { ProductImageService } from './services/product-image.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductImage])],
  controllers: [ProductImageController],
  providers: [ProductImageService],
  exports: [TypeOrmModule, ProductImageService],
})
export class ProductImageModule {}
