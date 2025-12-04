import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { Category } from '../../shared/schemas/entities/category.entity';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/common/enums/role.enum';

@ApiTags('Category')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // 🔹 Public API
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả danh mục' })
  @ApiResponse({ status: 200, description: 'Danh sách danh mục.' })
  async findAll(): Promise<Category[]> {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một danh mục' })
  @ApiResponse({ status: 200, description: 'Chi tiết danh mục.' })
  @ApiParam({ name: 'id', required: true, description: 'ID của danh mục' })
  async findOne(@Param('id') id: string): Promise<Category> {
    return this.categoryService.findOne(id);
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm theo Category ID' })
  @ApiParam({ name: 'id', required: true, description: 'ID của category' })
  async getProductsByCategory(@Param('id') id: string) {
    return this.categoryService.getProductsByCategory(id);
  }

  // 🔹 Admin API
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Tạo danh mục mới (Admin)' })
  @ApiBody({ type: CreateCategoryDto })
  @ApiResponse({ status: 201, description: 'Tạo mới danh mục thành công.' })
  async create(@Body() dto: CreateCategoryDto): Promise<Category> {
    return this.categoryService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cập nhật danh mục (Admin)' })
  @ApiBody({ type: UpdateCategoryDto })
  @ApiResponse({ status: 200, description: 'Cập nhật danh mục thành công.' })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto): Promise<Category> {
    return this.categoryService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Xóa danh mục (Admin)' })
  @ApiParam({ name: 'id', required: true })
  @ApiResponse({ status: 200, description: 'Xóa danh mục thành công.' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.categoryService.remove(id);
  }
}
