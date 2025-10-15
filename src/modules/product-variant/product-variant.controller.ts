
import { Controller, Get, Post, Body, Param, Delete, Put, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariant } from '../../shared/schemas/entities/product-variant.entity';
import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';

@Controller('product-variants')
export class ProductVariantController {
  constructor(
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
  ) {}

  @Post()
  async create(@Body() dto: CreateProductVariantDto) {
    const variant = this.variantRepository.create(dto);
    return this.variantRepository.save(variant);
  }

  @Get()
  async findAll(@Query() query: any) {
    return this.variantRepository.find({ where: query });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.variantRepository.findOne({ where: { id } });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateProductVariantDto) {
    await this.variantRepository.update(id, dto);
    return this.variantRepository.findOne({ where: { id } });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.variantRepository.delete(id);
  }
}
