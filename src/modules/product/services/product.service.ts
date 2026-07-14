import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Product } from '../../../shared/schemas/entities/product.entity';
import { Category } from '../../../shared/schemas/entities/category.entity';
import { Brand } from '../../../shared/schemas/entities/brand.entity';
import { ProductVariant } from '../../../shared/schemas/entities/product-variant.entity';
import { ProductImage } from '../../../shared/schemas/entities/product-image.entity';
import { FlashSaleItem } from '../../../shared/schemas/entities/flash-sale-item.entity';
import { FlashSale } from '../../../shared/schemas/entities/flash-sale.entity';
import { Review } from '../../../shared/schemas/entities/review.entity';
import { OrderItem } from '../../../shared/schemas/entities/order-item.entity';
import { CartItem } from '../../../shared/schemas/entities/cart-item.entity';
import { Wishlist } from '../../../shared/schemas/entities/wishlist.entity';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant) private variantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductImage) private productImageRepository: Repository<ProductImage>,
    @InjectRepository(Category) private categoryRepository: Repository<Category>,
    @InjectRepository(Brand) private brandRepository: Repository<Brand>,
    @InjectRepository(FlashSaleItem) private flashSaleItemRepository: Repository<FlashSaleItem>,
    @InjectRepository(FlashSale) private flashSaleRepository: Repository<FlashSale>,
    @InjectRepository(Review) private reviewRepository: Repository<Review>,
    @InjectRepository(OrderItem) private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(CartItem) private cartItemRepository: Repository<CartItem>,
    @InjectRepository(Wishlist) private wishlistRepository: Repository<Wishlist>,
  ) {}

  /** Tạo sản phẩm */
  async create(dto: CreateProductDto, sellerId?: string): Promise<Product> {
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
      costPrice: dto.costPrice ?? 0, // Lưu costPrice
      brand: dto.brand || brandEntity?.name || '', // Giữ lại brand string để backward compatibility
      status: dto.status ?? 'ACTIVE',
      hasVariants: dto.hasVariants ?? false,
      categoryId: categoryEntity?.id,
      brandId: brandEntity?.id,
      image: dto.imageUrl || '', // Lưu imageUrl vào field image
      sellerId: sellerId || undefined, // Lưu sellerId nếu có (dùng undefined thay vì null)
    });

    const savedProduct = await this.productRepository.save(product) as Product;

    // Tạo ảnh chính trong product_images nếu có imageUrl
    if (dto.imageUrl && dto.imageUrl.trim()) {
      // Kiểm tra xem đã có ảnh chính chưa (tránh duplicate)
      const existingMainImage = await this.productImageRepository.findOne({
        where: { productId: savedProduct.id, isMain: true }
      });
      
      if (!existingMainImage) {
        // Tạo ảnh chính với isMain = true
        const mainImage = this.productImageRepository.create({
          productId: savedProduct.id,
          imageUrl: dto.imageUrl,
          isMain: true,
        });
        await this.productImageRepository.save(mainImage);
      } else if (existingMainImage.imageUrl !== dto.imageUrl) {
        // Cập nhật URL của ảnh chính nếu khác
        existingMainImage.imageUrl = dto.imageUrl;
        await this.productImageRepository.save(existingMainImage);
      }
    }

    // Tạo variant nếu có
    if (dto.hasVariants && dto.variants?.length) {
      // Validate và tạo variants - cho phép chỉ có colorId (không có sizeId)
      const variants = dto.variants.map(v => {
        if (!v.colorId) {
          throw new BadRequestException('Variant must have colorId');
        }
        // sizeId là optional - có thể null nếu không chọn size
        return this.variantRepository.create({
          productId: savedProduct.id,
          colorId: v.colorId,
          sizeId: v.sizeId || null, // Cho phép null nếu không có size
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
    costPrice: dto.costPrice !== undefined ? dto.costPrice : (product.costPrice ?? 0), // Cập nhật costPrice
    status: dto.status ?? product.status,
    hasVariants: dto.hasVariants ?? product.hasVariants,
    categoryId: categoryEntity?.id ?? product.categoryId,
    brandId: brandEntity?.id ?? product.brandId,
    brand: dto.brand || brandEntity?.name || product.brand, // Giữ lại brand string
  };

  // Thêm image nếu có imageUrl
  if (imageUrl) {
    updateData.image = imageUrl;
    
    // Cập nhật hoặc tạo ảnh chính trong product_images
    const existingMainImage = await this.productImageRepository.findOne({
      where: { productId: id, isMain: true }
    });
    
    if (existingMainImage) {
      // Cập nhật URL của ảnh chính
      existingMainImage.imageUrl = imageUrl;
      await this.productImageRepository.save(existingMainImage);
    } else {
      // Tạo ảnh chính mới nếu chưa có
      // Đảm bảo không có ảnh chính nào khác
      await this.productImageRepository.update(
        { productId: id },
        { isMain: false }
      );
      
      const mainImage = this.productImageRepository.create({
        productId: id,
        imageUrl: imageUrl,
        isMain: true,
      });
      await this.productImageRepository.save(mainImage);
    }
  }

  await this.productRepository.update(id, updateData);

  // 5. Xử lý variants riêng
  if (dto.hasVariants !== undefined) {
    // Xóa hết variants cũ
    await this.variantRepository.delete({ productId: id });

    // Thêm variants mới nếu có
    if (dto.hasVariants && variants?.length) {
      const newVariants = variants.map(v => {
        if (!v.colorId) {
          throw new BadRequestException('Variant must have colorId');
        }
        return this.variantRepository.create({
          productId: id,
          colorId: v.colorId,
          sizeId: v.sizeId || null, // Cho phép null nếu không có size
          priceOverride: v.priceOverride ?? 0,
          stockQuantity: v.stockQuantity ?? 0,
        });
      });
      await this.variantRepository.save(newVariants);
    }
  }

  // 6. Trả về sản phẩm mới với relations
  return this.findOne(id);
}


  /** Lấy sản phẩm theo ID */
  async findOne(id: string, includeFlashSales: boolean = false): Promise<Product> {
    const relations = ['category', 'brandEntity', 'variants', 'variants.color', 'variants.size', 'images'];
    
    // Chỉ load flashSales nếu được yêu cầu (để tránh load không cần thiết khi tạo sản phẩm)
    if (includeFlashSales) {
      relations.push('flashSales', 'flashSales.items');
    }
    
    const product = await this.productRepository.findOne({
      where: { id },
      relations,
    });
    if (!product) throw new BadRequestException('Product not found');
    return product;
  }

async findAll(query: any): Promise<{ data: Product[]; total: number; page: number; limit: number }> {
  const { q, brand, category, status, sellerId, page = 1, limit = 20 } = query;

  // Debug logging
  console.log('[ProductService.findAll] Query params:', { q, brand, category, status, sellerId, page, limit });

  const qb = this.productRepository.createQueryBuilder('product')
    .leftJoinAndSelect('product.category', 'category')
    .leftJoinAndSelect('product.brandEntity', 'brandEntity')
    .leftJoinAndSelect('product.variants', 'variants')
    .leftJoinAndSelect('variants.color', 'color')      
    .leftJoinAndSelect('variants.size', 'size')      
    .leftJoinAndSelect('product.flashSales', 'flashSales')
    .leftJoinAndSelect('flashSales.items', 'flashSaleItems')
    .leftJoinAndSelect('product.images', 'images')
    .leftJoinAndSelect('product.seller', 'seller');

  if (q)
    qb.andWhere('(LOWER(product.name) LIKE :q OR LOWER(product.description) LIKE :q)', { q: `%${q.toLowerCase()}%` });

  if (brand) {
    if (brand.includes('-')) {
      qb.andWhere('product.brandId = :brandId', { brandId: brand });
    } else {
      qb.andWhere('(LOWER(product.brand) = :brandName OR LOWER(brandEntity.name) = :brandName)', {
        brandName: brand.toLowerCase(),
      });
    }
  }

  if (status) qb.andWhere('product.status = :status', { status });

  // Filter theo sellerId nếu có
  if (sellerId) {
    console.log('[ProductService.findAll] Filtering by sellerId:', sellerId);
    qb.andWhere('product.sellerId = :sellerId', { sellerId });
  } else {
    console.log('[ProductService.findAll] No sellerId filter - returning all products');
  }

  // Hỗ trợ filter theo cả ID hoặc name của category
  if (category) {
    // Nếu category là UUID (có dấu gạch ngang), filter theo ID
    if (category.includes('-')) {
      qb.andWhere('category.id = :category', { category });
    } else {
      // Ngược lại filter theo name
      qb.andWhere('LOWER(category.name) = :category', { category: category.toLowerCase() });
    }
  }

  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 20;
  const skip = (pageNum - 1) * limitNum;

  // Sắp xếp sản phẩm mới nhất lên đầu (createdAt DESC)
  qb.orderBy('product.createdAt', 'DESC');

  // Log SQL query trước khi execute
  const sql = qb.getSql();
  const params = qb.getParameters();
  console.log('[ProductService.findAll] SQL Query:', sql);
  console.log('[ProductService.findAll] Query Parameters:', params);

  const [data, total] = await qb.skip(skip).take(limitNum).getManyAndCount();

  console.log('[ProductService.findAll] Result:', { 
    dataCount: data.length, 
    total, 
    page: pageNum, 
    limit: limitNum,
    sellerIds: data.map(p => p.sellerId).filter(Boolean),
    firstProductSellerId: data[0]?.sellerId || null
  });

  // Nếu có sellerId filter nhưng không có kết quả, log thêm thông tin
  if (sellerId && data.length === 0) {
    console.warn('[ProductService.findAll] ⚠️ WARNING: sellerId filter applied but no products found!');
    console.warn('[ProductService.findAll] sellerId:', sellerId);
    // Kiểm tra xem có sản phẩm nào với sellerId này không
    const checkProducts = await this.productRepository.find({
      where: { sellerId },
      select: ['id', 'name', 'sellerId']
    });
    console.warn('[ProductService.findAll] Products in DB with this sellerId:', checkProducts.length);
    if (checkProducts.length > 0) {
      console.warn('[ProductService.findAll] Sample product IDs:', checkProducts.slice(0, 3).map(p => p.id));
    }
  }

  return { data, total, page: pageNum, limit: limitNum };
}

  /** Xóa sản phẩm */
  async remove(id: string): Promise<void> {
    // Kiểm tra sản phẩm có tồn tại không
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) {
      throw new BadRequestException('Product not found');
    }

    // Lấy tất cả variants của sản phẩm để xóa OrderItem liên quan
    const variants = await this.variantRepository.find({ where: { productId: id } });
    const variantIds = variants.map(v => v.id);

    // Xóa các bản ghi liên quan theo thứ tự (từ child đến parent)
    // 1. Xóa CartItem (nếu có variantId trong variants)
    // CartItem có composite primary key, cần dùng In() operator
    if (variantIds.length > 0) {
      await this.cartItemRepository.delete({ variantId: In(variantIds) });
    }

    // 2. Xóa OrderItem (nếu có variantId trong variants)
    // OrderItem có composite primary key (orderId, variantId), cần xóa bằng query builder
    if (variantIds.length > 0) {
      await this.orderItemRepository
        .createQueryBuilder()
        .delete()
        .from(OrderItem)
        .where('variantId IN (:...variantIds)', { variantIds })
        .execute();
    }

    // 3. Xóa Wishlist (có productId)
    await this.wishlistRepository.delete({ productId: id });

    // 4. Xóa FlashSaleItem (có productId)
    await this.flashSaleItemRepository.delete({ productId: id });

    // 5. Xóa FlashSale (có productId)
    await this.flashSaleRepository.delete({ productId: id });

    // 6. Xóa Review (có productId)
    await this.reviewRepository.delete({ productId: id });

    // 7. Xóa ProductImage (có productId)
    await this.productImageRepository.delete({ productId: id });

    // 8. Xóa ProductVariant (có productId)
    await this.variantRepository.delete({ productId: id });

    // 9. Cuối cùng xóa Product
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
    .leftJoinAndSelect('product.images', 'images')
    .leftJoinAndSelect('product.flashSales', 'flashSales')
    .leftJoinAndSelect('flashSales.items', 'flashSaleItems');

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
