import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../shared/schemas/entities/category.entity';
import { Product } from '../../shared/schemas/entities/product.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,

    @InjectRepository(Product)
    private productRepository: Repository<Product>, // Inject Product repository
  ) {}

  /** Tạo danh mục mới (Admin) */
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name },
    });
    if (existingCategory) throw new ConflictException('Tên danh mục đã tồn tại.');

    const newCategory = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(newCategory);
  }

  /** Lấy tất cả danh mục */
  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({ order: { name: 'ASC' } });
  }

  /** Lấy chi tiết danh mục theo ID */
  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { id } });
    if (!category) throw new NotFoundException(`Không tìm thấy danh mục với ID ${id}.`);
    return category;
  }

  /** Cập nhật danh mục (Admin) */
  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existing = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name },
      });
      if (existing && existing.id !== id)
        throw new ConflictException('Tên danh mục mới đã tồn tại.');
    }

    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  /** Xóa danh mục (Admin) */
  async remove(id: string): Promise<void> {
    const result = await this.categoryRepository.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Không tìm thấy danh mục với ID ${id} để xóa.`);
  }

  /** Lấy danh sách sản phẩm theo Category ID */
  async getProductsByCategory(categoryId: string) {
    // Kiểm tra category có tồn tại không
    await this.findOne(categoryId);

    // Trả về danh sách sản phẩm
    return this.productRepository.find({
      where: { category: { id: categoryId } },
      order: { name: 'ASC' }, // có thể sắp xếp
    });
  }
}
