import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Brand } from '../../shared/schemas/entities/brand.entity';
import { Product } from '../../shared/schemas/entities/product.entity';
import { CreateBrandDto, UpdateBrandDto } from './dto/brand.dto';

@Injectable()
export class BrandService {
  constructor(
    @InjectRepository(Brand)
    private brandRepository: Repository<Brand>,

    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(createBrandDto: CreateBrandDto): Promise<Brand> {
    const existingBrand = await this.brandRepository.findOne({
      where: { name: createBrandDto.name },
    });
    if (existingBrand) throw new ConflictException('Tên thương hiệu đã tồn tại.');

    const newBrand = this.brandRepository.create(createBrandDto);
    return this.brandRepository.save(newBrand);
  }

  async findAll(page: number = 1, limit: number = 20): Promise<{ data: Brand[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await this.brandRepository.findAndCount({
      order: { name: 'ASC' },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Brand> {
    const brand = await this.brandRepository.findOne({ where: { id } });
    if (!brand) throw new NotFoundException(`Không tìm thấy thương hiệu với ID ${id}.`);
    return brand;
  }

  async update(id: string, updateBrandDto: UpdateBrandDto): Promise<Brand> {
    const brand = await this.findOne(id);

    if (updateBrandDto.name && updateBrandDto.name !== brand.name) {
      const existing = await this.brandRepository.findOne({
        where: { name: updateBrandDto.name },
      });
      if (existing && existing.id !== id)
        throw new ConflictException('Tên thương hiệu mới đã tồn tại.');
    }

    Object.assign(brand, updateBrandDto);
    return this.brandRepository.save(brand);
  }

  async remove(id: string): Promise<void> {
    const result = await this.brandRepository.delete(id);
    if (result.affected === 0)
      throw new NotFoundException(`Không tìm thấy thương hiệu với ID ${id} để xóa.`);
  }

  async getProductsByBrand(brandId: string) {
    await this.findOne(brandId);

    return this.productRepository.find({
      where: { brandEntity: { id: brandId } },
      order: { name: 'ASC' },
    });
  }
}




