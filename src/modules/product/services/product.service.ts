import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Product } from '../../../shared/schemas/entities/product.entity';
import { Category } from '../../../shared/schemas/entities/category.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(data: any): Promise<Product> {
    let categoryEntity: Category | undefined = undefined;
    if (data.category) {
      const found = await this.categoryRepository.findOne({ where: { id: data.category } });
      if (!found) {
        throw new Error('Category not found');
      }
      categoryEntity = found;
    }
    const createPayload: DeepPartial<Product> = {
      ...data,
      category: categoryEntity,
    };
    const product = this.productRepository.create(createPayload);
    const saved = await this.productRepository.save(product);
    return saved as Product;
  }

  async findAll(query: any): Promise<{ data: Product[]; total: number; page: number; limit: number }> {
    const { q, brand, category, status, page = 1, limit = 10 } = query;

    const pageNum = Number(page) || 1;
    const take = Number(limit) || 10;
    const limitNum = Number(take);

    if (Number.isNaN(pageNum) || pageNum < 1) {
      throw new BadRequestException('`page` must be a positive integer >= 1');
    }
    if (Number.isNaN(limitNum) || limitNum < 1) {
      throw new BadRequestException('`limit` must be a positive integer >= 1');
    }

    const skip = (pageNum - 1) * limitNum;

    const qb = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category');

    if (q) {
      const qLower = String(q).toLowerCase();
      qb.andWhere('(LOWER(product.name) LIKE :q OR LOWER(product.description) LIKE :q)', { q: `%${qLower}%` });
    }

    if (brand) {
      qb.andWhere('product.brand = :brand', { brand });
    }

    if (status) {
      qb.andWhere('product.status = :status', { status });
    }

    if (category) {
      // filter by category name (case-insensitive exact match)
      qb.andWhere('LOWER(category.name) = :categoryName', { categoryName: String(category).toLowerCase() });
    }

    const [data, total] = await qb
      .skip(skip)
      .take(limitNum)
      .getManyAndCount();

    return { data, total, page: pageNum, limit: limitNum };
  }

  async findOne(id: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });
  }

  async findOneOrNull(id: string): Promise<Product | null> {
    return this.productRepository.findOne({
      where: { id },
      relations: ['category'],
    });
  }

  async update(id: string, data: Partial<Product>): Promise<Product | null> {
    await this.productRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.productRepository.delete(id);
  }
}
