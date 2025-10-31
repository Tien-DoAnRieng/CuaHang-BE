import { Controller, Get, Post, Delete, Param, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleEnum } from '../../common/enums/role.enum';

@ApiTags('Wishlist')
@ApiBearerAuth('access-token')
@Controller('wishlist')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Post()
  @ApiOperation({ summary: 'User thêm sản phẩm vào wishlist' })
  async add(@Req() req, @Body() dto: CreateWishlistDto) {
    return this.wishlistService.addToWishlist(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'User xem wishlist của chính mình' })
  async getMyWishlist(@Req() req) {
    return this.wishlistService.getMyWishlist(req.user.id);
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'User xóa sản phẩm khỏi wishlist' })
  async remove(@Req() req, @Param('productId') productId: string) {
    return this.wishlistService.removeFromWishlist(req.user.id, productId);
  }

  /** 🧑‍💼 ADMIN */
  @Get('admin/all')
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Admin xem toàn bộ wishlist' })
  @ApiResponse({ status: 200, description: 'Danh sách tất cả wishlist của mọi người' })
  async getAll(@Req() req) {
    return this.wishlistService.getAllWishlists(req.user.roles[0]);
  }
}
