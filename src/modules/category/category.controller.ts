// src/modules/category/category.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { Category } from '../../shared/schemas/entities/category.entity';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // 1. API CÔNG KHAI (Dành cho Client/Public)
  /** API: Lấy danh sách tất cả danh mục (Client có thể xem) */
  @Get()
  async findAll(): Promise<Category[]> {
    return this.categoryService.findAll();
  }
  /** API: Lấy chi tiết một danh mục (Client/Public) */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Category> {
    return this.categoryService.findOne(id);
  }
  // 2. API QUẢN LÝ (Chỉ dành cho ADMIN)
  /** API: Tạo danh mục mới (Chức năng Admin) */
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Admin') // BẮT BUỘC: Chỉ Admin được phép
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<Category> {
    return this.categoryService.create(createCategoryDto);
  }

  /** API: Cập nhật danh mục (Chức năng Admin) */
  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Admin') // BẮT BUỘC: Chỉ Admin được phép
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoryService.update(id, updateCategoryDto);
  }

  /** API: Xóa danh mục (Chức năng Admin) */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Admin') // BẮT BUỘC: Chỉ Admin được phép
  async remove(@Param('id') id: string): Promise<void> {
    return this.categoryService.remove(id);
  }
}

