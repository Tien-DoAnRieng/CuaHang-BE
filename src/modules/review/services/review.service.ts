import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../../../shared/schemas/entities/review.entity';
import { Order } from '../../../shared/schemas/entities/order.entity';
import { OrderItem } from '../../../shared/schemas/entities/order-item.entity';
import { ProductVariant } from '../../../shared/schemas/entities/product-variant.entity';
import { CreateReviewDto } from '../dto/create-review.dto';
import { OrderStatus } from '../../../common/enums/order-status.enum';
import { UpdateReviewDto } from '../dto/update-review.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepo: Repository<OrderItem>,
    @InjectRepository(ProductVariant)
    private readonly variantRepo: Repository<ProductVariant>,
  ) {}

  // Ensure user bought the product in a PAID order
  private async userHasPurchasedProduct(userId: string, productId: string): Promise<boolean> {
    const orders = await this.orderRepo.find({
      where: { userId, status: OrderStatus.PAID },
      relations: ['items', 'items.variant'],
    });

    for (const o of orders) {
      if (!o.items) continue;
      for (const it of o.items) {
        if (it.variant && (it.variant as ProductVariant).productId === productId) return true;
      }
    }
    return false;
  }

  async create(userId: string, dto: CreateReviewDto): Promise<Review> {
    // verify purchase
    const bought = await this.userHasPurchasedProduct(userId, dto.productId);
    if (!bought) throw new ForbiddenException('Bạn chỉ có thể đánh giá sau khi mua hàng');

    const r = this.reviewRepo.create({
      productId: dto.productId,
      userId,
      rating: dto.rating,
      comment: dto.comment || '',
    });
    return this.reviewRepo.save(r);
  }

  async findByProduct(productId: string, page = 1, limit = 10) {
    const [data, total] = await this.reviewRepo.findAndCount({
      where: { productId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const avg = await this.reviewRepo
      .createQueryBuilder('r')
      .select('AVG(r.rating)', 'avg')
      .where('r.productId = :productId', { productId })
      .getRawOne();

    return {
      data,
      total,
      page,
      limit,
      averageRating: Number(avg?.avg ?? 0),
    };
  }

  async findAllAdmin(filters: { productId?: string; userId?: string }, page = 1, limit = 20) {
    const qb = this.reviewRepo.createQueryBuilder('r').leftJoinAndSelect('r.user', 'user').leftJoinAndSelect('r.product', 'product');
    if (filters.productId) qb.andWhere('r.productId = :productId', { productId: filters.productId });
    if (filters.userId) qb.andWhere('r.userId = :userId', { userId: filters.userId });
    const total = await qb.getCount();
    const data = await qb.orderBy('r.createdAt', 'DESC').skip((page - 1) * limit).take(limit).getMany();
    return { data, total, page, limit };
  }

  async update(id: string, userId: string, dto: UpdateReviewDto) {
    const r = await this.reviewRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('Review not found');
    if (r.userId !== userId) throw new ForbiddenException('Không có quyền sửa review này');
    if (dto.rating !== undefined) r.rating = dto.rating;
    if (dto.comment !== undefined) r.comment = dto.comment;
    return this.reviewRepo.save(r);
  }

  async remove(id: string, userId?: string, isAdmin = false) {
    const r = await this.reviewRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('Review not found');
    if (!isAdmin && r.userId !== userId) throw new ForbiddenException('Không có quyền xóa review này');
    await this.reviewRepo.remove(r);
    return { deleted: true };
  }
}
