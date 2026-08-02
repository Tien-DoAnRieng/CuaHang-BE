import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { Coupon } from '../../shared/schemas/entities/coupon.entity';
import { UserVoucher } from '../../shared/schemas/entities/user-voucher.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Coupon, UserVoucher])],
  controllers: [CouponController],
  providers: [CouponService],
  exports: [CouponService],
})
export class CouponModule {}
