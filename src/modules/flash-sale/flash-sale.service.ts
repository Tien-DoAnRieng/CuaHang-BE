import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FlashSale } from '../../shared/schemas/entities/flash-sale.entity';
import { FlashSaleItem } from '../../shared/schemas/entities/flash-sale-item.entity';
import { ProductVariant } from '../../shared/schemas/entities/product-variant.entity';
import { CreateFlashSaleDto } from './dto/create-flash-sale.dto';

@Injectable()
export class FlashSaleService {
  constructor(
    @InjectRepository(FlashSale)
    private flashSaleRepo: Repository<FlashSale>,

    @InjectRepository(FlashSaleItem)
    private flashSaleItemRepo: Repository<FlashSaleItem>,

    @InjectRepository(ProductVariant)
    private productVariantRepo: Repository<ProductVariant>,
  ) {}

  async create(dto: CreateFlashSaleDto) {
    const flashSale = this.flashSaleRepo.create({
      title: dto.title,
      startTime: dto.startTime,
      endTime: dto.endTime,
      isActive: dto.isActive,
      productId: dto.productId,
    });

    const saved = await this.flashSaleRepo.save(flashSale);

    const items = await Promise.all(
      dto.items.map(async item => {
        const variant = await this.productVariantRepo.findOne({
          where: { id: item.productVariantId },
        });
        if (!variant) throw new NotFoundException('ProductVariant not found');

        return this.flashSaleItemRepo.create({
          flashSale: { id: saved.id },
          productVariant: { id: item.productVariantId },
          productId: variant.productId,
          salePrice:
            item.discountType === 'PERCENT'
              ? item.originalPrice * (1 - item.discountValue / 100)
              : item.originalPrice - item.discountValue,
          discountPercent:
            item.discountType === 'PERCENT' ? item.discountValue : undefined,
          quantity: item.quantity ?? 0,
          note: item.note,
        });
      }),
    );

    await this.flashSaleItemRepo.save(items);
    return saved;
  }
  async findAll(page: number, limit: number) {
    return this.flashSaleRepo.find({
      relations: ['items'],
      skip: (page - 1) * limit,
      take: limit,
    });
  }
  async findOne(id: string) {
    const flashSale = await this.flashSaleRepo.findOne({
      where: { id },
      relations: ['items'],
    });
    if (!flashSale) throw new NotFoundException('FlashSale not found');
    return flashSale;
  }
  async update(id: string, dto: CreateFlashSaleDto) {
    await this.flashSaleRepo.update(id, {
      title: dto.title,
      startTime: dto.startTime,
      endTime: dto.endTime,
      isActive: dto.isActive,
      productId: dto.productId,
    });

    // Xoá tất cả items cũ
    await this.flashSaleItemRepo.delete({ flashSale: { id } });

    const items = await Promise.all(
      dto.items.map(async item => {
        const variant = await this.productVariantRepo.findOne({
          where: { id: item.productVariantId },
        });
        if (!variant) throw new NotFoundException('ProductVariant not found');

        return this.flashSaleItemRepo.create({
          flashSale: { id },
          productVariant: { id: item.productVariantId },
          productId: variant.productId,
          salePrice:
            item.discountType === 'PERCENT'
              ? item.originalPrice * (1 - item.discountValue / 100)
              : item.originalPrice - item.discountValue,
          discountPercent:
            item.discountType === 'PERCENT' ? item.discountValue : undefined,
          quantity: item.quantity ?? 0,
          note: item.note,
        });
      }),
    );

    await this.flashSaleItemRepo.save(items);

    return this.findOne(id);
  }

  async delete(id: string) {
    await this.flashSaleItemRepo.delete({ flashSale: { id } });
    return this.flashSaleRepo.delete(id);
  }
}
