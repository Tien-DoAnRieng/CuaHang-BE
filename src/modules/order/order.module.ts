import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../shared/schemas/entities/order.entity';
import { OrderItem } from '../../shared/schemas/entities/order-item.entity';
import { Address } from '../../shared/schemas/entities/address.entity';
import { Payment } from '../../shared/schemas/entities/payment.entity';
import { Product } from '../../shared/schemas/entities/product.entity';
import { ProductVariant } from '../../shared/schemas/entities/product-variant.entity';
import { QueueModule } from '../queue/queue.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { CouponModule } from '../coupon/coupon.module';

@Module({

  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Address,
      Payment,
      Product,
      ProductVariant,
    ]),
    QueueModule,
    MailerModule, // Import MailerModule để có thể gửi email trực tiếp khi queue fail
    CouponModule, // Import CouponModule để sử dụng CouponService
  ],
  exports: [TypeOrmModule,]
})
export class OrderModule {}
