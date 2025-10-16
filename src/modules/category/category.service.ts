// src/modules/category/category.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../shared/schemas/entities/category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  /** Chức năng: Tạo danh mục mới (Admin) */
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Kiểm tra xem tên danh mục đã tồn tại chưa
    const existingCategory = await this.categoryRepository.findOne({
      where: { name: createCategoryDto.name },
    });
    if (existingCategory) {
      throw new ConflictException('Tên danh mục đã tồn tại.');
    }

    const newCategory = this.categoryRepository.create(createCategoryDto);
    return this.categoryRepository.save(newCategory);
  }

  /** Chức năng: Lấy tất cả danh mục (Admin/Client) */
  async findAll(): Promise<Category[]> {
    return this.categoryRepository.find({
      order: { name: 'ASC' },
    });
  }

  /** Chức năng: Lấy chi tiết danh mục theo ID (Admin/Client) */
  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id: id },
    });
    if (!category) {
      throw new NotFoundException(`Không tìm thấy danh mục với ID ${id}.`);
    }
    return category;
  }

  /** Chức năng: Cập nhật danh mục (Admin) */
  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findOne(id); // Kiểm tra tồn tại

    // Kiểm tra tên danh mục trùng (ngoại trừ chính nó)
    if (updateCategoryDto.name !== category.name) {
      const existing = await this.categoryRepository.findOne({
        where: { name: updateCategoryDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Tên danh mục mới đã tồn tại.');
      }
    }

    // Cập nhật và lưu
    Object.assign(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  /** Chức năng: Xóa danh mục (Admin) */
  async remove(id: string): Promise<void> {
    // Lưu ý: TypeORM sẽ tự động xử lý lỗi Foreign Key Constraint (ví dụ: RESTRICT)
    // nếu danh mục còn sản phẩm, đảm bảo tính toàn vẹn dữ liệu.
    const result = await this.categoryRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(
        `Không tìm thấy danh mục với ID ${id} để xóa.`,
      );
    }
  }
}
