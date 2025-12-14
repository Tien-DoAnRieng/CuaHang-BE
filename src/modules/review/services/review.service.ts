import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
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
  // Danh sách từ ngữ không phù hợp (có thể chuyển sang config file)
  private readonly forbiddenWords = [
    'spam', 'scam', 'lừa đảo', 'fake', 'giả mạo', 
    'lừa', 'đảo', 'phản cảm', 'thô tục'
  ];

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

  // Helper function để sanitize và validate comment
  private sanitizeComment(comment: string): string {
    if (!comment) return '';
    
    let sanitized = comment
      .replace(/[<>{}[\]\\|`]/g, '') // Loại bỏ ký tự nguy hiểm
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Loại bỏ script tags
      .replace(/<[^>]+>/g, '') // Loại bỏ HTML tags
      .replace(/\s+/g, ' ') // Chuẩn hóa khoảng trắng
      .trim();
    
    // Giới hạn độ dài
    if (sanitized.length > 1000) {
      sanitized = sanitized.substring(0, 1000);
    }
    
    return sanitized;
  }

  // Helper function để kiểm tra từ ngữ không phù hợp
  private validateForbiddenWords(comment: string): void {
    const lowerComment = comment.toLowerCase();
    for (const word of this.forbiddenWords) {
      if (lowerComment.includes(word.toLowerCase())) {
        throw new BadRequestException(`Bình luận chứa từ ngữ không phù hợp: "${word}"`);
      }
    }
  }

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

    // Validate và sanitize comment
    let sanitizedComment = '';
    if (dto.comment) {
      sanitizedComment = this.sanitizeComment(dto.comment);
      
      // Kiểm tra từ ngữ không phù hợp
      if (sanitizedComment) {
        this.validateForbiddenWords(sanitizedComment);
      }
    }

    const r = this.reviewRepo.create({
      productId: dto.productId,
      userId,
      rating: dto.rating,
      comment: sanitizedComment,
      status: 'pending', // Mặc định là pending, admin sẽ approve
    });
    return this.reviewRepo.save(r);
  }

  async findByProduct(productId: string, page = 1, limit = 10) {
    const [data, total] = await this.reviewRepo.findAndCount({
      where: { productId, status: 'approved' }, // Chỉ hiển thị reviews đã được approve
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

  async findAllAdmin(filters: { productId?: string; userId?: string; status?: string }, page = 1, limit = 20) {
    const qb = this.reviewRepo.createQueryBuilder('r').leftJoinAndSelect('r.user', 'user').leftJoinAndSelect('r.product', 'product');
    if (filters.productId) qb.andWhere('r.productId = :productId', { productId: filters.productId });
    if (filters.userId) qb.andWhere('r.userId = :userId', { userId: filters.userId });
    if (filters.status && filters.status !== 'all') {
      qb.andWhere('r.status = :status', { status: filters.status });
    }
    const total = await qb.getCount();
    const data = await qb.orderBy('r.createdAt', 'DESC').skip((page - 1) * limit).take(limit).getMany();
    return { data, total, page, limit };
  }

  async update(id: string, userId: string, dto: UpdateReviewDto) {
    const r = await this.reviewRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('Review not found');
    if (r.userId !== userId) throw new ForbiddenException('Không có quyền sửa review này');
    
    if (dto.rating !== undefined) r.rating = dto.rating;
    
    if (dto.comment !== undefined) {
      // Validate và sanitize comment giống như create
      let sanitizedComment = '';
      if (dto.comment) {
        sanitizedComment = this.sanitizeComment(dto.comment);
        
        // Kiểm tra từ ngữ không phù hợp
        if (sanitizedComment) {
          this.validateForbiddenWords(sanitizedComment);
        }
      }
      r.comment = sanitizedComment;
    }
    
    return this.reviewRepo.save(r);
  }

  async remove(id: string, userId?: string, isAdmin = false) {
    const r = await this.reviewRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('Review not found');
    if (!isAdmin && r.userId !== userId) throw new ForbiddenException('Không có quyền xóa review này');
    await this.reviewRepo.remove(r);
    return { deleted: true };
  }

  // Admin methods for review moderation
  async approveReview(id: string): Promise<Review> {
    const r = await this.reviewRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('Review not found');
    r.status = 'approved';
    return this.reviewRepo.save(r);
  }

  async rejectReview(id: string): Promise<Review> {
    const r = await this.reviewRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('Review not found');
    r.status = 'violated';
    return this.reviewRepo.save(r);
  }

  async markAsViolated(id: string): Promise<Review> {
    const r = await this.reviewRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('Review not found');
    r.status = 'violated';
    return this.reviewRepo.save(r);
  }

  async addReply(id: string, reply: string): Promise<Review> {
    const r = await this.reviewRepo.findOne({ where: { id } });
    if (!r) throw new NotFoundException('Review not found');
    r.reply = reply;
    r.replyDate = new Date();
    return this.reviewRepo.save(r);
  }
}
