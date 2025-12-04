import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import cloudinaryConfig from './config/cloudinary.config';
import vnpayConfig from './config/vnpay.config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeOrmConfig } from './config/typeorm.config';
import { UserModule } from './modules/user/user.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ProductModule } from './modules/product/product.module';
import { CartModule } from './modules/cart/cart.module';
import { OrderModule } from './modules/order/order.module';
import { AuthModule } from './modules/auth/auth.module';

import { CategoryModule } from './modules/category/category.module';
import { ProductImageModule } from './modules/product-image/product-image.module';
import { ProductVariantModule } from './modules/product-variant/product-variant.module';
import { BannerModule } from './modules/banner/banner.module';
import { QueueModule } from './modules/queue/queue.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { ReviewModule } from './modules/review/review.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { ConfigService } from '@nestjs/config';
import { AddressModule } from './modules/order/adrees.module';
import { FlashSaleModule } from './modules/flash-sale/flash-sale.module';
import { ColorSizeModule } from './modules/color-size/color-size.module';
@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
      load: [cloudinaryConfig,vnpayConfig],
    }),
    TypeOrmModule.forRootAsync(typeOrmConfig),
  UserModule,
  ProductModule,
  PaymentModule,
  CategoryModule,
  ProductImageModule,
  ProductVariantModule,
  CartModule,
  OrderModule,
  AuthModule,
  ReviewModule,
  WishlistModule,
  QueueModule,
  FileUploadModule,
  AddressModule,
  DashboardModule,
  BannerModule,
  FlashSaleModule,
  ColorSizeModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
