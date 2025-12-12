import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../../shared/schemas/entities/product.entity';
import { Category } from '../../../shared/schemas/entities/category.entity';
import { Brand } from '../../../shared/schemas/entities/brand.entity';
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
    @InjectRepository(Brand) private brandRepository: Repository<Brand>,
    @InjectRepository(FlashSaleItem) private flashSaleItemRepository: Repository<FlashSaleItem>,
  ) {}

  /** Tạo sản phẩm */
  async create(dto: CreateProductDto): Promise<Product> {
    let categoryEntity: Category | undefined;
    let brandEntity: Brand | undefined;

    if (dto.category) {
      const cat = await this.categoryRepository.findOne({ where: { id: dto.category } });
      categoryEntity = cat ?? undefined;
      if (!categoryEntity) throw new BadRequestException('Category not found');
    }

    // Xử lý brand: ưu tiên brandId, nếu không có thì dùng brand string
    if (dto.brandId) {
      const brand = await this.brandRepository.findOne({ where: { id: dto.brandId } });
      if (!brand) throw new BadRequestException('Brand not found');
      brandEntity = brand;
    }

    const product = this.productRepository.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      brand: dto.brand || brandEntity?.name || '', // Giữ lại brand string để backward compatibility
      status: dto.status ?? 'ACTIVE',
      hasVariants: dto.hasVariants ?? false,
      categoryId: categoryEntity?.id,
      brandId: brandEntity?.id,
      image: dto.imageUrl || '', // Lưu imageUrl vào field image
    });

    const savedProduct = await this.productRepository.save(product);

    // Tạo variant nếu có
    if (dto.hasVariants && dto.variants?.length) {
      // Validate và tạo variants với colorId và sizeId
      const variants = dto.variants.map(v => {
        if (!v.colorId || !v.sizeId) {
          throw new BadRequestException('Variant must have both colorId and sizeId');
        }
        return this.variantRepository.create({
          productId: savedProduct.id,
          colorId: v.colorId,
          sizeId: v.sizeId,
          stockQuantity: v.stockQuantity ?? 0,
          priceOverride: v.priceOverride,
        });
      });
      await this.variantRepository.save(variants);
    }

    return this.findOne(savedProduct.id);
  }

  /** Cập nhật sản phẩm */
  async update(id: string, dto: UpdateProductDto): Promise<Product> {
  // 1. Lấy sản phẩm hiện tại
  const product = await this.productRepository.findOne({ where: { id } });
  if (!product) throw new BadRequestException('Product not found');

  // 2. Lấy category nếu được cung cấp
  let categoryEntity: Category | undefined;
  if (dto.category) {
    const cat = await this.categoryRepository.findOne({ where: { id: dto.category } });
    if (!cat) throw new BadRequestException('Category not found');
    categoryEntity = cat;
  }

  // 2b. Lấy brand nếu được cung cấp
  let brandEntity: Brand | undefined;
  if (dto.brandId) {
    const brand = await this.brandRepository.findOne({ where: { id: dto.brandId } });
    if (!brand) throw new BadRequestException('Brand not found');
    brandEntity = brand;
  }

  // 3. Tách các trường liên quan đến quan hệ One-to-Many và các field không phải của Product entity
  const { category, variants, brandId, imageUrl, ...dtoScalar } = dto;

  // 4. Update các trường scalar của product
  const updateData: any = {
    name: dto.name ?? product.name,
    description: dto.description ?? product.description,
    price: dto.price ?? product.price,
    status: dto.status ?? product.status,
    hasVariants: dto.hasVariants ?? product.hasVariants,
    categoryId: categoryEntity?.id ?? product.categoryId,
    brandId: brandEntity?.id ?? product.brandId,
    brand: dto.brand || brandEntity?.name || product.brand, // Giữ lại brand string
  };

  // Thêm image nếu có imageUrl
  if (imageUrl) {
    updateData.image = imageUrl;
  }

  await this.productRepository.update(id, updateData);

  // 5. Xử lý variants riêng
  if (dto.hasVariants !== undefined) {
    // Xóa hết variants cũ
    await this.variantRepository.delete({ productId: id });

    // Thêm variants mới nếu có
    if (dto.hasVariants && variants?.length) {
      const newVariants = variants.map(v =>
        this.variantRepository.create({
          productId: id,
          colorId: v.colorId,
          sizeId: v.sizeId,
          priceOverride: v.priceOverride ?? 0,
          stockQuantity: v.stockQuantity ?? 0,
        }),
      );
      await this.variantRepository.save(newVariants);
    }
  }

  // 6. Trả về sản phẩm mới với relations
  return this.findOne(id);
}


  /** Lấy sản phẩm theo ID */
  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['category', 'brandEntity', 'variants', 'variants.color', 'variants.size', 'flashSales', 'flashSales.items', 'images'],
    });
    if (!product) throw new BadRequestException('Product not found');
    return product;
  }

async findAll(query: any): Promise<{ data: Product[]; total: number; page: number; limit: number }> {
  const { q, brand, category, status, page = 1, limit = 20 } = query;

  const qb = this.productRepository.createQueryBuilder('product')
    .leftJoinAndSelect('product.category', 'category')
    .leftJoinAndSelect('product.brandEntity', 'brandEntity')
    .leftJoinAndSelect('product.variants', 'variants')
    .leftJoinAndSelect('variants.color', 'color')      
    .leftJoinAndSelect('variants.size', 'size')      
    .leftJoinAndSelect('product.flashSales', 'flashSales')
    .leftJoinAndSelect('flashSales.items', 'flashSaleItems')
    .leftJoinAndSelect('product.images', 'images');

  if (q)
    qb.andWhere('(LOWER(product.name) LIKE :q OR LOWER(product.description) LIKE :q)', { q: `%${q.toLowerCase()}%` });

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
  return 0;
}
async findAllWithRelations(query: any) {
  const qb = this.productRepository.createQueryBuilder('product')
    .leftJoinAndSelect('product.category', 'category')
    .leftJoinAndSelect('product.variants', 'variants')
    .leftJoinAndSelect('variants.color', 'color')
    .leftJoinAndSelect('variants.size', 'size')
    .leftJoinAndSelect('product.images', 'images');

  if (query.q) {
    qb.andWhere('product.name LIKE :q', { q: `%${query.q}%` });
  }

  if (query.category) {
    qb.andWhere('category.id = :category', { category: query.category });
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 20;
  qb.skip((page - 1) * limit).take(limit);

  const [data, total] = await qb.getManyAndCount();

  return {
    data,
    total,
    page,
    limit
  };
}



}
