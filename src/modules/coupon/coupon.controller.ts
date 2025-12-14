import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CouponService } from './coupon.service';
import { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';
import { Coupon } from '../../shared/schemas/entities/coupon.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleEnum } from '../../common/enums/role.enum';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Coupons')
@Controller('coupons')
@ApiBearerAuth('access-token')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Tạo mã giảm giá mới (Admin)' })
  @ApiBody({ type: CreateCouponDto })
  @ApiResponse({ status: 201, description: 'Tạo mã giảm giá thành công.', type: Coupon })
  async create(@Body() createDto: CreateCouponDto): Promise<Coupon> {
    return this.couponService.create(createDto);
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả mã giảm giá' })
  @ApiQuery({ name: 'status', required: false, description: 'Lọc theo trạng thái' })
  @ApiResponse({ status: 200, description: 'Danh sách mã giảm giá.', type: [Coupon] })
  async findAll(@Query('status') status?: string): Promise<Coupon[]> {
    const coupons = await this.couponService.findAll();
    if (status) {
      return coupons.filter(c => c.status === status.toUpperCase());
    }
    return coupons;
  }

  @Public()
  @Get('validate/:code')
  @ApiOperation({ summary: 'Kiểm tra mã giảm giá có hợp lệ không' })
  @ApiParam({ name: 'code', required: true, description: 'Mã giảm giá' })
  @ApiQuery({ name: 'orderAmount', required: false, type: Number, description: 'Tổng tiền đơn hàng' })
  @ApiResponse({ status: 200, description: 'Mã giảm giá hợp lệ.', type: Coupon })
  async validate(
    @Param('code') code: string,
    @Query('orderAmount') orderAmount?: string,
  ): Promise<Coupon> {
    const amount = orderAmount ? parseFloat(orderAmount) : undefined;
    return this.couponService.validateCoupon(code, undefined, amount);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một mã giảm giá' })
  @ApiParam({ name: 'id', required: true, description: 'ID của mã giảm giá' })
  @ApiResponse({ status: 200, description: 'Chi tiết mã giảm giá.', type: Coupon })
  async findOne(@Param('id') id: string): Promise<Coupon> {
    return this.couponService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Cập nhật mã giảm giá (Admin)' })
  @ApiParam({ name: 'id', required: true, description: 'ID của mã giảm giá' })
  @ApiBody({ type: UpdateCouponDto })
  @ApiResponse({ status: 200, description: 'Cập nhật mã giảm giá thành công.', type: Coupon })
  async update(@Param('id') id: string, @Body() updateDto: UpdateCouponDto): Promise<Coupon> {
    return this.couponService.update(id, updateDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiOperation({ summary: 'Xóa mã giảm giá (Admin)' })
  @ApiParam({ name: 'id', required: true, description: 'ID của mã giảm giá' })
  @ApiResponse({ status: 200, description: 'Xóa mã giảm giá thành công.' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.couponService.remove(id);
  }
}
