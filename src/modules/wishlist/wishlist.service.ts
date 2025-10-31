import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wishlist } from '../../shared/schemas/entities/wishlist.entity';
import { Product } from '../../shared/schemas/entities/product.entity';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { RoleEnum } from '../../common/enums/role.enum';

@Injectable()
export class WishlistService {
  constructor(
    @InjectRepository(Wishlist)
    private wishlistRepo: Repository<Wishlist>,

    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  /** ✅ User thêm sản phẩm vào wishlist */
  async addToWishlist(userId: string, dto: CreateWishlistDto) {
    const product = await this.productRepo.findOne({ where: { id: dto.productId } });
    if (!product) throw new BadRequestException('Sản phẩm không tồn tại');

    const exist = await this.wishlistRepo.findOne({ where: { userId, productId: dto.productId } });
    if (exist) throw new BadRequestException('Sản phẩm đã có trong wishlist');

    const wishlist = this.wishlistRepo.create({ userId, productId: dto.productId });
    await this.wishlistRepo.save(wishlist);
    return { message: 'Đã thêm vào wishlist' };
  }

  /** ✅ User xem wishlist của mình */
  async getMyWishlist(userId: string) {
    return await this.wishlistRepo.find({
      where: { userId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
    });
  }

  /** ✅ User xóa sản phẩm khỏi wishlist */
  async removeFromWishlist(userId: string, productId: string) {
    const exist = await this.wishlistRepo.findOne({ where: { userId, productId } });
    if (!exist) throw new BadRequestException('Sản phẩm không có trong wishlist');

    await this.wishlistRepo.delete({ userId, productId });
    return { message: 'Đã xóa khỏi wishlist' };
  }

  /** ✅ Admin xem toàn bộ wishlist */
  async getAllWishlists(role: string) {
    if (role !== RoleEnum.ADMIN) {
      throw new ForbiddenException('Bạn không có quyền xem toàn bộ wishlist');
    }

    return await this.wishlistRepo.find({
      relations: ['user', 'product'],
      order: { createdAt: 'DESC' },
    });
  }
}
