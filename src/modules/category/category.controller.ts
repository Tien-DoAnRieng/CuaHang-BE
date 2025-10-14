import { Controller, Post, Body, Get, Param, Put, Delete } from '@nestjs/common';
import { Category } from './category.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Controller('categories')
export class CategoryController {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  @Post()
  async create(@Body() data: Partial<Category>) {
    const category = this.categoryRepository.create(data);
    return this.categoryRepository.save(category);
  }

  @Get()
  async findAll() {
    return this.categoryRepository.find();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.categoryRepository.findOne({ where: { id } });
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<Category>) {
    await this.categoryRepository.update(id, data);
    return this.categoryRepository.findOne({ where: { id } });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.categoryRepository.delete(id);
  }
}
