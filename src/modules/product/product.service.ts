import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product } from '../../shared/schemas/entities/product.entity';
import { Category } from '../../shared/schemas/entities/category.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(data: Partial<Product>): Promise<Product> {
    const product = this.productRepository.create(data);
    return this.productRepository.save(product);
  }

  async findAll(query: any): Promise<{ data: Product[]; total: number; page: number; limit: number }> {
    const { search, brand, category, status, minPrice, maxPrice, page = 1, limit = 10 } = query;

    const where: any = {};
    if (search) {
      where.name = ILike(`%${search}%`);
    }
    if (brand) where.brand = brand;
    if (category) where.category = { id: category };
    if (status) where.status = status;
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price['$gte'] = minPrice;
      if (maxPrice) where.price['$lte'] = maxPrice;
    }
    const [data, total] = await this.productRepository.findAndCount({


    return this.productRepository.find({
      where,
      relations: ['category'],
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page: Number(page), limit: Number(limit) };
  }

  async findOne(id: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });
  }

  
  async findOneOrNull(id: string): Promise<Product | null> {
<<<<<<< src/modules/product/product.service.ts
    return this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });
    return this.productRepository.findOne({ where: { id }, relations: ['category'] });


  }

  async update(id: string, data: Partial<Product>): Promise<Product | null> {
    await this.productRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.productRepository.delete(id);
  }
}
