import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../../shared/schemas/entities/product.entity';
import { Category } from '../../../shared/schemas/entities/category.entity';
import { ProductVariant } from '../../../shared/schemas/entities/product-variant.entity';
import { FlashSaleItem } from '../../../shared/schemas/entities/flash-sale-item.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant) private variantRepository: Repository<ProductVariant>,
    @InjectRepository(Category) private categoryRepository: Repository<Category>,
    @InjectRepository(FlashSaleItem) private flashSaleItemRepository: Repository<FlashSaleItem>,
  ) {}

  /** Tạo sản phẩm */
  async create(dto: CreateProductDto): Promise<Product> {
    let categoryEntity: Category | undefined;

    if (dto.category) {
      const cat = await this.categoryRepository.findOne({ where: { id: dto.category } });
      categoryEntity = cat ?? undefined;
      if (!categoryEntity) throw new BadRequestException('Category not found');
    }

    const product = this.productRepository.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      brand: dto.brand,
      status: dto.status ?? 'ACTIVE',
      hasVariants: dto.hasVariants ?? false,
      categoryId: categoryEntity?.id,
    });

    const savedProduct = await this.productRepository.save(product);

    // Tạo variant nếu có
    if (dto.hasVariants && dto.variants?.length) {
      const variants = dto.variants.map(v =>
        this.variantRepository.create({ productId: savedProduct.id, ...v }),
      );
      await this.variantRepository.save(variants);
    }

    return this.findOne(savedProduct.id);
  }

  /** Cập nhật sản phẩm */
  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new BadRequestException('Product not found');

    let categoryEntity: Category | undefined;
    if (dto.category) {
      const cat = await this.categoryRepository.findOne({ where: { id: dto.category } });
      categoryEntity = cat ?? undefined;
      if (!categoryEntity) throw new BadRequestException('Category not found');
    }

    // Bỏ category ra khỏi dto để tránh lỗi TypeORM
    const { category, ...dtoWithoutCategory } = dto;

    await this.productRepository.update(id, {
      ...dtoWithoutCategory,
      categoryId: categoryEntity?.id,
    });

    // Cập nhật variants
    if (dto.hasVariants !== undefined) {
      if (dto.hasVariants && dto.variants?.length) {
        await this.variantRepository.delete({ productId: id });
        const variants = dto.variants.map(v =>
          this.variantRepository.create({ productId: id, ...v }),
        );
        await this.variantRepository.save(variants);
      } else if (!dto.hasVariants) {
        await this.variantRepository.delete({ productId: id });
      }
    }

    return this.findOne(id);
  }

  /** Lấy sản phẩm theo ID */
  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'variants', 'flashSales', 'flashSales.items'],
    });
    if (!product) throw new BadRequestException('Product not found');
    return product;
  }

  /** Lấy danh sách sản phẩm */
  async findAll(query: any): Promise<{ data: Product[]; total: number; page: number; limit: number }> {
    const { q, brand, category, status, page = 1, limit = 20 } = query;

    const qb = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('product.flashSales', 'flashSales')
      .leftJoinAndSelect('flashSales.items', 'flashSaleItems');

    if (q) qb.andWhere('(LOWER(product.name) LIKE :q OR LOWER(product.description) LIKE :q)', { q: `%${q.toLowerCase()}%` });
    if (brand) qb.andWhere('product.brand = :brand', { brand });
    if (status) qb.andWhere('product.status = :status', { status });
    if (category) qb.andWhere('LOWER(category.name) = :category', { category: category.toLowerCase() });

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [data, total] = await qb.skip(skip).take(limitNum).getManyAndCount();
    return { data, total, page: pageNum, limit: limitNum };
  }

  /** Xóa sản phẩm */
  async remove(id: string): Promise<void> {
    await this.productRepository.delete(id);
  }

  /** Lấy giá flash sale hiện tại (nếu có) */
  getFinalPrice(product: Product): number {
    const now = new Date();

    if (product.flashSales?.length) {
      for (const fs of product.flashSales) {
        if (fs.isActive && fs.startTime <= now && fs.endTime >= now) {
          // Lấy item flash sale hợp lệ
          const activeItem = fs.items?.[0];
          if (activeItem) return activeItem.salePrice;
        }
      }
    }

    return product.price;
  }
  /** Lấy tổng tồn kho của sản phẩm */
async getStock(productId: string): Promise<number> {
  // Lấy product cùng tất cả variants
  const product = await this.productRepository.findOne({
    where: { id: productId },
    relations: ['variants'], // bắt buộc load variants
  });

  if (!product) throw new BadRequestException('Product not found');

  // Nếu product có variants, tính tổng stockQuantity
  if (product.hasVariants && product.variants?.length) {
    return product.variants.reduce((sum, v) => sum + (v.stockQuantity ?? 0), 0);
  }

  // Nếu product không có variants, có thể trả 0 hoặc thêm trường stock
  return 0;
}



}
