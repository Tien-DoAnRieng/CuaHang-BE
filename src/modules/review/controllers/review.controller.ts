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
import { Roles } from '../../../common/decorators/roles.decorator';
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
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth('access-token')
  @Get()
  @ApiOperation({ summary: 'Admin: Xem tất cả đánh giá (phân trang, tìm kiếm)' })
  async findAllAdmin(@Query() q: QueryReviewDto) {
    const page = Number(q.page) || 1;
    const limit = Number(q.limit) || 20;
    return this.reviewService.findAllAdmin({ productId: q.productId, userId: q.userId }, page, limit);
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

  // Admin delete - separate route to clarify permissions
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth('access-token')
  @Delete('admin/:id')
  @ApiOperation({ summary: 'Admin: Xoá đánh giá vi phạm' })
  async adminRemove(@Param('id') id: string) {
    return this.reviewService.remove(id, undefined, true);
  }
}
