import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductImage } from '../../../shared/schemas/entities/product-image.entity';

@Injectable()
export class ProductImageService {
  constructor(
    @InjectRepository(ProductImage)
    private readonly imageRepository: Repository<ProductImage>,
  ) {}

  create(data: Partial<ProductImage>) {
    const image = this.imageRepository.create(data);
    return this.imageRepository.save(image);
  }

  findAll(query: any) {
    return this.imageRepository.find({ where: query });
  }

  findOne(id: string) {
    return this.imageRepository.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<ProductImage>) {
    await this.imageRepository.update(id, data);
    return this.imageRepository.findOne({ where: { id } });
  }

  remove(id: string) {
    return this.imageRepository.delete(id);
  }
}
