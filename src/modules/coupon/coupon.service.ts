import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon } from '../../shared/schemas/entities/coupon.entity';
import { UserVoucher } from '../../shared/schemas/entities/user-voucher.entity';
import { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private couponRepository: Repository<Coupon>,
    @InjectRepository(UserVoucher)
    private userVoucherRepository: Repository<UserVoucher>,
  ) {}

  async create(createDto: CreateCouponDto): Promise<Coupon> {
    // Kiểm tra mã code đã tồn tại chưa
    const existing = await this.couponRepository.findOne({
      where: { code: createDto.code.toUpperCase() },
    });
    if (existing) {
      throw new ConflictException('Mã giảm giá đã tồn tại.');
    }

    // Validate discount value
    if (createDto.discountType === 'PERCENT' && createDto.discountValue > 100) {
      throw new BadRequestException('Phần trăm giảm giá không được vượt quá 100%.');
    }

    // Validate dates
    if (createDto.startDate && createDto.endDate) {
      const start = new Date(createDto.startDate);
      const end = new Date(createDto.endDate);
      if (start >= end) {
        throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu.');
      }
    }

    const couponData: Partial<Coupon> = {
      code: createDto.code.toUpperCase(), // Uppercase code
      name: createDto.name,
      description: createDto.description,
      discountType: createDto.discountType,
      discountValue: createDto.discountValue,
      minOrderAmount: createDto.minOrderAmount,
      maxDiscountAmount: createDto.maxDiscountAmount,
      startDate: createDto.startDate ? new Date(createDto.startDate) : undefined,
      endDate: createDto.endDate ? new Date(createDto.endDate) : undefined,
      usageLimit: createDto.usageLimit ?? 0,
      usedCount: 0,
      usageLimitPerUser: createDto.usageLimitPerUser ?? 1,
      status: createDto.status || 'ACTIVE',
      applicableCategories: createDto.applicableCategories,
      applicableProducts: createDto.applicableProducts,
    };

    const newCoupon = this.couponRepository.create(couponData);
    return await this.couponRepository.save(newCoupon);
  }

  async findAll(): Promise<Coupon[]> {
    return this.couponRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException(`Không tìm thấy mã giảm giá với ID ${id}.`);
    }
    return coupon;
  }

  async findByCode(code: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({
      where: { code: code.toUpperCase() },
    });
    if (!coupon) {
      throw new NotFoundException(`Không tìm thấy mã giảm giá với code ${code}.`);
    }
    return coupon;
  }

  async update(id: string, updateDto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.findOne(id);

    // Validate discount value
    if (updateDto.discountType === 'PERCENT' || coupon.discountType === 'PERCENT') {
      const discountValue = updateDto.discountValue ?? coupon.discountValue;
      if (discountValue > 100) {
        throw new BadRequestException('Phần trăm giảm giá không được vượt quá 100%.');
      }
    }

    // Validate dates
    const startDate = updateDto.startDate ? new Date(updateDto.startDate) : coupon.startDate;
    const endDate = updateDto.endDate ? new Date(updateDto.endDate) : coupon.endDate;
    if (startDate && endDate && startDate >= endDate) {
      throw new BadRequestException('Ngày kết thúc phải sau ngày bắt đầu.');
    }

    Object.assign(coupon, {
      ...updateDto,
      startDate: updateDto.startDate ? new Date(updateDto.startDate) : coupon.startDate,
      endDate: updateDto.endDate ? new Date(updateDto.endDate) : coupon.endDate,
    });

    return this.couponRepository.save(coupon);
  }

  async remove(id: string): Promise<void> {
    const result = await this.couponRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Không tìm thấy mã giảm giá với ID ${id} để xóa.`);
    }
  }

  async incrementUsage(id: string): Promise<void> {
    const coupon = await this.findOne(id);
    coupon.usedCount = (coupon.usedCount || 0) + 1;
    await this.couponRepository.save(coupon);
  }

  async validateCoupon(code: string, userId?: string, orderAmount?: number): Promise<Coupon> {
    const coupon = await this.findByCode(code);

    // Kiểm tra trạng thái
    if (coupon.status !== 'ACTIVE') {
      throw new BadRequestException('Mã giảm giá không còn hiệu lực.');
    }

    // Kiểm tra ngày hiệu lực
    const now = new Date();
    if (coupon.startDate && now < coupon.startDate) {
      throw new BadRequestException('Mã giảm giá chưa có hiệu lực.');
    }
    if (coupon.endDate && now > coupon.endDate) {
      throw new BadRequestException('Mã giảm giá đã hết hạn.');
    }

    // Kiểm tra xem coupon có phải là voucher cá nhân không
    const userVoucher = await this.userVoucherRepository.findOne({
      where: { coupon: { id: coupon.id } },
      relations: ['user'],
    });

    if (userVoucher) {
      if (!userId) {
        throw new BadRequestException('Mã giảm giá cá nhân. Vui lòng đăng nhập để sử dụng.');
      }
      if (userVoucher.user.id !== userId) {
        throw new BadRequestException('Mã giảm giá này không thuộc sở hữu của bạn.');
      }
      if (userVoucher.isUsed) {
        throw new BadRequestException('Mã giảm giá này đã được sử dụng.');
      }
      if (userVoucher.expiresAt && now > userVoucher.expiresAt) {
        throw new BadRequestException('Mã giảm giá đã hết hạn.');
      }
    }

    // Kiểm tra giới hạn sử dụng
    if (coupon.usageLimit && coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng.');
    }

    // Kiểm tra đơn hàng tối thiểu
    if (orderAmount && coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      throw new BadRequestException(`Đơn hàng tối thiểu là ${coupon.minOrderAmount.toLocaleString('vi-VN')}₫.`);
    }

    return coupon;
  }
}
