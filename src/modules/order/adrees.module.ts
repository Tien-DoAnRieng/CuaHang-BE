import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressController } from './controllers/address.controller';
import { AddressService } from './services/address.service';
import { Address } from '../../shared/schemas/entities/address.entity';
import { Order } from '../../shared/schemas/entities/order.entity';
import { OrderItem } from '../../shared/schemas/entities/order-item.entity';
import { Payment } from '../../shared/schemas/entities/payment.entity';
import { User } from '../../shared/schemas/entities/user.entity';
import { ProductVariant } from '../../shared/schemas/entities/product-variant.entity';
import { Product } from '../../shared/schemas/entities/product.entity';
import { Review } from '../../shared/schemas/entities/review.entity';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';
import { QueueModule } from '../queue/queue.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { CouponModule } from '../coupon/coupon.module';
import { CartModule } from '../cart/cart.module';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';

@Module({
  imports: [
    TypeOrmModule.forFeature([Address, Order, OrderItem, Payment, User, ProductVariant, Product, Review]),
    QueueModule,
    CouponModule,
    CartModule,
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST || 'smtp.gmail.com',
        port: Number(process.env.MAIL_PORT) || 587,
        secure: false,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      },
      defaults: {
        from: `"E-Commerce Admin" <${process.env.MAIL_USER || 'noreply@example.com'}>`,
      },
      template: {
        dir: join(process.cwd(), 'src/modules/auth/templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  controllers: [AddressController, OrderController],
  providers: [AddressService, OrderService],
  exports: [AddressService, OrderService],
})
export class AddressModule {}
