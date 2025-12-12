import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Patch, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BrandService } from './brand.service';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';
import { Brand } from '../../shared/schemas/entities/brand.entity';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleEnum } from 'src/common/enums/role.enum';

@ApiTags('Brand')
@Controller('brands')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thương hiệu với phân trang' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số lượng mỗi trang (mặc định: 20)' })
  @ApiResponse({ status: 200, description: 'Danh sách thương hiệu với phân trang.' })
  async findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? Number(page) : 1;
    const limitNum = limit ? Number(limit) : 20;
    return this.brandService.findAll(pageNum, limitNum);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một thương hiệu' })
  @ApiResponse({ status: 200, description: 'Chi tiết thương hiệu.' })
  @ApiParam({ name: 'id', required: true, description: 'ID của thương hiệu' })
  async findOne(@Param('id') id: string): Promise<Brand> {
    return this.brandService.findOne(id);
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'Lấy danh sách sản phẩm theo Brand ID' })
  @ApiParam({ name: 'id', required: true, description: 'ID của brand' })
  async getProductsByBrand(@Param('id') id: string) {
    return this.brandService.getProductsByBrand(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Tạo thương hiệu mới (Admin)' })
  @ApiBody({ type: CreateBrandDto })
  @ApiResponse({ status: 201, description: 'Tạo mới thương hiệu thành công.' })
  async create(@Body() dto: CreateBrandDto): Promise<Brand> {
    return this.brandService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cập nhật thương hiệu (Admin) - PATCH' })
  @ApiBody({ type: UpdateBrandDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thương hiệu thành công.' })
  async partialUpdate(@Param('id') id: string, @Body() dto: UpdateBrandDto): Promise<Brand> {
    return this.brandService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Xóa thương hiệu (Admin)' })
  @ApiParam({ name: 'id', required: true })
  @ApiResponse({ status: 200, description: 'Xóa thương hiệu thành công.' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.brandService.remove(id);
  }
}




