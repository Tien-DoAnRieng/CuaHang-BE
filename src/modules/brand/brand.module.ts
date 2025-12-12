import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandController } from './brand.controller';
import { BrandService } from './brand.service';
import { Brand } from '../../shared/schemas/entities/brand.entity';
import { Product } from '../../shared/schemas/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Brand, Product])],
  controllers: [BrandController],
  providers: [BrandService],
  exports: [BrandService],
})
export class BrandModule {}




