import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeOrmConfig } from './config/typeorm.config';
import { UserModule } from './modules/user/user.module';
import { ProductModule } from './modules/product/product.module';
import { CartModule } from './modules/cart/cart.module';
import { OrderModule } from './modules/order/order.module';
import { AuthModule } from './modules/auth/auth.module';
import { MailModule } from './modules/mail/mail.module';
import { QueueModule } from './modules/queue/queue.module';
import { FileUploadModule } from './modules/file-upload/file-upload.module';
import { ReviewModule } from './modules/review/review.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';

@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync(typeOrmConfig),
    UserModule,
    ProductModule,
    CartModule,
    OrderModule,
    AuthModule,
    ReviewModule,
    WishlistModule,
    MailModule,
    QueueModule,
    FileUploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
