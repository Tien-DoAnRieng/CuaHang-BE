import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { Category } from '../../shared/schemas/entities/category.entity';
import { Product } from '../../shared/schemas/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category,Product]),
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService], 
})
export class CategoryModule {}
