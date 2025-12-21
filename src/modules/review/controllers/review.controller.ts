import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Query,
  Put,
  Delete,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { OwnershipGuard } from '../../../common/guards/ownership.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Ownership } from '../../../common/decorators/ownership.decorator';
import { RoleEnum } from '../../../common/enums/role.enum';
import { ReviewService } from '../services/review.service';
import { CreateReviewDto } from '../dto/create-review.dto';
import { UpdateReviewDto } from '../dto/update-review.dto';
import { QueryReviewDto } from '../dto/query-review.dto';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Post()
  @ApiOperation({ summary: 'User: Gửi đánh giá (chỉ sau khi mua hàng)' })
  async create(@Req() req: any, @Body() dto: CreateReviewDto) {
    const userId = req.user?.id;
    return this.reviewService.create(userId, dto);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'GUEST: Xem đánh giá theo sản phẩm + điểm trung bình' })
  async findByProduct(@Param('productId') productId: string, @Query('page') page = '1', @Query('limit') limit = '10') {
    const p = Number(page) || 1;
    const l = Number(limit) || 10;
    return this.reviewService.findByProduct(productId, p, l);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiBearerAuth('access-token')
  @Get()
  @ApiOperation({ summary: 'Admin/Seller: Xem đánh giá (Cả Admin và Seller đều thấy tất cả đánh giá)' })
  async findAllAdmin(@Req() req: any, @Query() q: QueryReviewDto) {
    const page = Number(q.page) || 1;
    const limit = Number(q.limit) || 20;
    
    // Cả Admin và Seller đều thấy tất cả đánh giá (không filter theo sellerId)
    return this.reviewService.findAllAdmin({ 
      productId: q.productId, 
      userId: q.userId,
      status: q.status,
      sellerId: undefined // Không filter, cho cả admin và seller thấy tất cả
    }, page, limit);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Put(':id')
  @ApiOperation({ summary: 'User: Sửa đánh giá của mình' })
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateReviewDto) {
    const userId = req.user?.id;
    return this.reviewService.update(id, userId, dto);
  }

  // User delete their own review
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @Delete(':id')
  @ApiOperation({ summary: 'User: Xoá đánh giá của mình (Admin can also delete)' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id;
    // Admins will call admin delete endpoint instead; here only owner allowed
    return this.reviewService.remove(id, userId, false);
  }

  // Admin/Seller delete - separate route to clarify permissions
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiBearerAuth('access-token')
  @Delete('admin/:id')
  @ApiOperation({ summary: 'Admin/Seller: Xoá đánh giá vi phạm (Cả Admin và Seller đều có thể xóa tất cả)' })
  async adminRemove(@Param('id') id: string) {
    return this.reviewService.remove(id, undefined, true);
  }

  // Admin approve review
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth('access-token')
  @Post('admin/:id/approve')
  @ApiOperation({ summary: 'Admin: Duyệt đánh giá' })
  async approveReview(@Param('id') id: string) {
    return this.reviewService.approveReview(id);
  }

  // Admin reject/violate review
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth('access-token')
  @Post('admin/:id/reject')
  @ApiOperation({ summary: 'Admin: Từ chối/Đánh dấu vi phạm đánh giá' })
  async rejectReview(@Param('id') id: string) {
    return this.reviewService.rejectReview(id);
  }

  // Admin mark as violated
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth('access-token')
  @Post('admin/:id/violate')
  @ApiOperation({ summary: 'Admin: Đánh dấu đánh giá vi phạm' })
  async markAsViolated(@Param('id') id: string) {
    return this.reviewService.markAsViolated(id);
  }

  // Admin/Seller add reply to review
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiBearerAuth('access-token')
  @Post('admin/:id/reply')
  @ApiOperation({ summary: 'Admin/Seller: Phản hồi đánh giá (Cả Admin và Seller đều có thể phản hồi tất cả)' })
  async addReply(@Param('id') id: string, @Body() body: { reply: string }) {
    return this.reviewService.addReply(id, body.reply);
  }
}
