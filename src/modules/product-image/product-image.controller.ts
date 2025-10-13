
import { Controller, Get, Post, Body, Param, Delete, Put, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductImage } from '../../shared/schemas/entities/product-image.entity';
import { CreateProductImageDto } from './dto/create-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';

@Controller('product-images')
export class ProductImageController {
  constructor(
    @InjectRepository(ProductImage)
    private readonly imageRepository: Repository<ProductImage>,
  ) {}

  @Post()
  async create(@Body() dto: CreateProductImageDto) {
    const image = this.imageRepository.create(dto);
    return this.imageRepository.save(image);
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.imageRepository.find({ where: query });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.imageRepository.findOne({ where: { id } });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductImageDto) {
    await this.imageRepository.update(id, dto);
    return this.imageRepository.findOne({ where: { id } });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.imageRepository.delete(id);
  }
}
