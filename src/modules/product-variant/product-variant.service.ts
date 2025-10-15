import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariant } from '../../shared/schemas/entities/product-variant.entity';

@Injectable()
export class ProductVariantService {
  constructor(
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
  ) {}

  create(data: Partial<ProductVariant>) {
    const variant = this.variantRepository.create(data);
    return this.variantRepository.save(variant);
  }

  findAll(query: any) {
    return this.variantRepository.find({ where: query });
  }

  findOne(id: string) {
    return this.variantRepository.findOne({ where: { id } });
  }

  async update(id: string, data: Partial<ProductVariant>) {
    await this.variantRepository.update(id, data);
    return this.variantRepository.findOne({ where: { id } });
  }

  remove(id: string) {
    return this.variantRepository.delete(id);
  }
}
