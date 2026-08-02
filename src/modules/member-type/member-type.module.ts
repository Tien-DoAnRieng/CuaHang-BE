import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemberTypeService } from './member-type.service';
import { MembershipService } from './membership.service';
import { MemberTypeController } from './member-type.controller';
import { MemberType } from '../../shared/schemas/entities/member-type.entity';
import { User } from '../../shared/schemas/entities/user.entity';
import { Order } from '../../shared/schemas/entities/order.entity';
import { MembershipHistory } from '../../shared/schemas/entities/membership-history.entity';
import { CashbackTransaction } from '../../shared/schemas/entities/cashback-transaction.entity';
import { UserVoucher } from '../../shared/schemas/entities/user-voucher.entity';
import { Coupon } from '../../shared/schemas/entities/coupon.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MemberType,
      User,
      Order,
      MembershipHistory,
      CashbackTransaction,
      UserVoucher,
      Coupon,
    ]),
  ],
  controllers: [MemberTypeController],
  providers: [MemberTypeService, MembershipService],
  exports: [MemberTypeService, MembershipService],
})
export class MemberTypeModule {}





