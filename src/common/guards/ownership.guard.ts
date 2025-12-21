import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OWNERSHIP_KEY } from '../decorators/ownership.decorator';
import { Product } from '../../shared/schemas/entities/product.entity';
import { Order } from '../../shared/schemas/entities/order.entity';
import { Review } from '../../shared/schemas/entities/review.entity';
import { RoleEnum } from '../enums/role.enum';

@Injectable()
export class OwnershipGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const resource = this.reflector.getAllAndOverride<string>(OWNERSHIP_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!resource) {
      return true; // Không có decorator ownership, cho phép
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const params = request.params;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Extract roles từ user object - hỗ trợ nhiều format
    let userRoles: string[] = [];
    if (Array.isArray(user.roles)) {
      userRoles = user.roles.map((r: any) => typeof r === 'string' ? r : (r.name || r));
    } else if (user.role) {
      // Nếu có role object
      const roleName = typeof user.role === 'string' ? user.role : (user.role.name || user.role);
      userRoles = [roleName];
    } else if (typeof user.roles === 'string') {
      userRoles = [user.roles];
    }

    // Admin có quyền truy cập tất cả
    if (userRoles.includes(RoleEnum.ADMIN)) {
      return true;
    }

    // Kiểm tra ownership dựa trên resource type
    switch (resource) {
      case 'product': {
        const productId = params.id;
        if (!productId) {
          throw new ForbiddenException('Product ID is required');
        }

        const product = await this.productRepository.findOne({
          where: { id: productId },
          relations: ['seller'],
        });

        if (!product) {
          throw new NotFoundException('Product not found');
        }

        // Seller chỉ có thể thao tác với sản phẩm của chính họ
        if (userRoles.includes(RoleEnum.SELLER)) {
          if (product.sellerId !== user.id) {
            throw new ForbiddenException('You can only manage your own products');
          }
        }

        return true;
      }

      case 'order': {
        const orderId = params.id;
        if (!orderId) {
          throw new ForbiddenException('Order ID is required');
        }

        const order = await this.orderRepository.findOne({
          where: { id: orderId },
          relations: ['items', 'items.variant', 'items.variant.product', 'items.variant.product.seller'],
        });

        if (!order) {
          throw new NotFoundException('Order not found');
        }

        // Seller chỉ có thể cập nhật đơn hàng chứa sản phẩm của họ
        if (userRoles.includes(RoleEnum.SELLER)) {
          const hasOwnProduct = order.items?.some(
            (item) => item.variant?.product?.sellerId === user.id,
          );

          if (!hasOwnProduct) {
            throw new ForbiddenException('You can only manage orders containing your products');
          }
        }

        return true;
      }

      case 'review': {
        const reviewId = params.id;
        if (!reviewId) {
          throw new ForbiddenException('Review ID is required');
        }

        const review = await this.reviewRepository.findOne({
          where: { id: reviewId },
          relations: ['product', 'product.seller'],
        });

        if (!review) {
          throw new NotFoundException('Review not found');
        }

        // Seller chỉ có thể thao tác với đánh giá của sản phẩm họ sở hữu
        if (userRoles.includes(RoleEnum.SELLER)) {
          if (review.product?.sellerId !== user.id) {
            throw new ForbiddenException('You can only manage reviews for your own products');
          }
        }

        return true;
      }

      default:
        return true;
    }
  }
}

