
import { Controller, Get, Post, Body, Param, Delete, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariant } from '../../shared/schemas/entities/product-variant.entity';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

@ApiTags('ProductVariant')
@Controller('product-variants')
export class ProductVariantController {
  constructor(
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Tạo biến thể sản phẩm mới' })
  @ApiBody({ type: CreateProductVariantDto })
  @ApiResponse({ status: 201, description: 'Tạo mới biến thể sản phẩm thành công.' })
  async create(@Body() dto: CreateProductVariantDto) {
    const variant = this.variantRepository.create(dto);
    return this.variantRepository.save(variant);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách biến thể sản phẩm' })
  @ApiResponse({ status: 200, description: 'Danh sách biến thể sản phẩm.' })
  async findAll(@Query() query: any) {
    return this.variantRepository.find({ where: query });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết biến thể sản phẩm' })
  @ApiResponse({ status: 200, description: 'Chi tiết biến thể sản phẩm.' })
  @ApiParam({ name: 'id', required: true, description: 'ID của biến thể' })
  async findOne(@Param('id') id: string) {
    return this.variantRepository.findOne({ where: { id } });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật biến thể sản phẩm' })
  @ApiResponse({ status: 200, description: 'Cập nhật biến thể sản phẩm thành công.' })
  @ApiParam({ name: 'id', required: true, description: 'ID của biến thể cần cập nhật' })
  @ApiBody({ type: UpdateProductVariantDto })
  async update(@Param('id') id: string, @Body() dto: UpdateProductVariantDto) {
    await this.variantRepository.update(id, dto);
    return this.variantRepository.findOne({ where: { id } });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa biến thể sản phẩm' })
  @ApiResponse({ status: 200, description: 'Xóa biến thể sản phẩm thành công.' })
  @ApiParam({ name: 'id', required: true, description: 'ID của biến thể cần xóa' })
  async remove(@Param('id') id: string) {
    return this.variantRepository.delete(id);
  }
}
