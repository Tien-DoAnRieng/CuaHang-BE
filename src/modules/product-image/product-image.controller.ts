
import { Controller, Get, Post, Body, Param, Delete, Put, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductImage } from '../../shared/schemas/entities/product-image.entity';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';

@ApiTags('ProductImage')
@Controller('product-images')
export class ProductImageController {
  constructor(
    @InjectRepository(ProductImage)
    private readonly imageRepository: Repository<ProductImage>,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Tạo ảnh sản phẩm mới' })
  @ApiBody({ type: CreateProductImageDto })
  @ApiResponse({ status: 201, description: 'Tạo mới ảnh sản phẩm thành công.' })
  async create(@Body() dto: CreateProductImageDto) {
    const image = this.imageRepository.create(dto);
    return this.imageRepository.save(image);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách ảnh sản phẩm' })
  @ApiResponse({ status: 200, description: 'Danh sách ảnh sản phẩm.' })
  async findAll(@Query() query: any) {
    return this.imageRepository.find({ where: query });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết ảnh sản phẩm' })
  @ApiResponse({ status: 200, description: 'Chi tiết ảnh sản phẩm.' })
  @ApiParam({ name: 'id', required: true, description: 'ID của ảnh' })
  async findOne(@Param('id') id: string) {
    return this.imageRepository.findOne({ where: { id } });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật ảnh sản phẩm' })
  @ApiResponse({ status: 200, description: 'Cập nhật ảnh sản phẩm thành công.' })
  @ApiParam({ name: 'id', required: true, description: 'ID của ảnh cần cập nhật' })
  @ApiBody({ type: UpdateProductImageDto })
  async update(@Param('id') id: string, @Body() dto: UpdateProductImageDto) {
    await this.imageRepository.update(id, dto);
    return this.imageRepository.findOne({ where: { id } });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa ảnh sản phẩm' })
  @ApiResponse({ status: 200, description: 'Xóa ảnh sản phẩm thành công.' })
  @ApiParam({ name: 'id', required: true, description: 'ID của ảnh cần xóa' })
  async remove(@Param('id') id: string) {
    return this.imageRepository.delete(id);
  }
}
