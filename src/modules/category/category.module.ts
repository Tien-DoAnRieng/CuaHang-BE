import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { Category } from '../../shared/schemas/entities/category.entity';
import { Product } from '../../shared/schemas/entities/product.entity';

@Module({
  imports: [
    // Đăng ký TypeORM Repository cho Entity Category
    TypeOrmModule.forFeature([Category,Product]),
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService], // Xuất CategoryService nếu các module khác (ví dụ: ProductModule) cần sử dụng nó
})
export class CategoryModule {}
