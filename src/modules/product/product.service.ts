import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product } from './product.entity';
import { Category } from '../category/category.entity';

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

  async findAll(query: any): Promise<Product[]> {
    const { search, brand, category, status, minPrice, maxPrice } = query;
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
    return this.productRepository.find({
      where,
      relations: ['category'],
    });
  }

  async findOne(id: string): Promise<Product | null> {
    return this.productRepository.findOne({ where: { id }, relations: ['category'] });
  }

  // Sửa kiểu trả về để phù hợp với TypeORM
  async findOneOrNull(id: string): Promise<Product | null> {
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
