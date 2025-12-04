import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariant } from '../../../shared/schemas/entities/product-variant.entity';
import { Product } from '../../../shared/schemas/entities/product.entity';
import { BadRequestException } from '@nestjs/common';
import { Category } from '../../../shared/schemas/entities/category.entity';
import { FlashSaleItem } from '../../../shared/schemas/entities/flash-sale-item.entity';
@Injectable()
export class ProductVariantService {
  constructor(
 
     @InjectRepository(Product) private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant) private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(Category) private categoryRepository: Repository<Category>,
    @InjectRepository(FlashSaleItem) private flashSaleItemRepository: Repository<FlashSaleItem>,
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
