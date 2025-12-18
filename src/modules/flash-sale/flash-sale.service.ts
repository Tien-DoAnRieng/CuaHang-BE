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
          relations: ['product'],
        });
        if (!variant) throw new NotFoundException('ProductVariant not found');

        // Lấy giá gốc từ variant (priceOverride hoặc product.price)
        const originalPrice = variant.priceOverride 
          ? parseFloat(String(variant.priceOverride))
          : parseFloat(String(variant.product?.price || 0));
        
        if (!originalPrice || originalPrice <= 0) {
          throw new NotFoundException(`Product variant ${item.productVariantId} has no valid price`);
        }

        // Validate discountValue
        if (item.discountType === 'PERCENT' && (item.discountValue < 0 || item.discountValue > 100)) {
          throw new NotFoundException(`Discount percent must be between 0 and 100`);
        }
        if (item.discountType === 'AMOUNT' && item.discountValue < 0) {
          throw new NotFoundException(`Discount amount must be positive`);
        }

        // Tính salePrice dựa trên discountType
        let salePrice: number;
        if (item.discountType === 'PERCENT') {
          salePrice = originalPrice * (1 - item.discountValue / 100);
        } else {
          // AMOUNT: giảm giá cố định
          salePrice = originalPrice - item.discountValue;
        }

        // Làm tròn đến 2 chữ số thập phân và đảm bảo không âm
        salePrice = Math.max(0, Math.round(salePrice * 100) / 100);

        return this.flashSaleItemRepo.create({
          flashSale: { id: saved.id },
          productVariant: { id: item.productVariantId },
          productId: variant.productId,
          salePrice: salePrice,
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
  async findActive() {
    const now = new Date();
    return this.flashSaleRepo
      .createQueryBuilder('flashSale')
      .leftJoinAndSelect('flashSale.items', 'items')
      .leftJoinAndSelect('items.productVariant', 'productVariant')
      .leftJoinAndSelect('productVariant.product', 'product')
      .leftJoinAndSelect('product.images', 'images')
      .leftJoinAndSelect('productVariant.color', 'color')
      .leftJoinAndSelect('productVariant.size', 'size')
      .where('flashSale.isActive = :isActive', { isActive: true })
      .andWhere('flashSale.startTime <= :now', { now })
      .andWhere('flashSale.endTime >= :now', { now })
      .getMany();
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
          relations: ['product'],
        });
        if (!variant) throw new NotFoundException('ProductVariant not found');

        // Lấy giá gốc từ variant (priceOverride hoặc product.price)
        const originalPrice = variant.priceOverride 
          ? parseFloat(String(variant.priceOverride))
          : parseFloat(String(variant.product?.price || 0));
        
        if (!originalPrice || originalPrice <= 0) {
          throw new NotFoundException(`Product variant ${item.productVariantId} has no valid price`);
        }

        // Validate discountValue
        if (item.discountType === 'PERCENT' && (item.discountValue < 0 || item.discountValue > 100)) {
          throw new NotFoundException(`Discount percent must be between 0 and 100`);
        }
        if (item.discountType === 'AMOUNT' && item.discountValue < 0) {
          throw new NotFoundException(`Discount amount must be positive`);
        }

        // Tính salePrice dựa trên discountType
        let salePrice: number;
        if (item.discountType === 'PERCENT') {
          salePrice = originalPrice * (1 - item.discountValue / 100);
        } else {
          // AMOUNT: giảm giá cố định
          salePrice = originalPrice - item.discountValue;
        }

        // Làm tròn đến 2 chữ số thập phân và đảm bảo không âm
        salePrice = Math.max(0, Math.round(salePrice * 100) / 100);

        return this.flashSaleItemRepo.create({
          flashSale: { id },
          productVariant: { id: item.productVariantId },
          productId: variant.productId,
          salePrice: salePrice,
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
