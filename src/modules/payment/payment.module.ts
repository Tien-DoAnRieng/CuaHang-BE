import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { Payment } from '../../shared/schemas/entities/payment.entity';
import { Order } from '../../shared/schemas/entities/order.entity';
import { PaymentService } from './services/payment.service';
import { MomoService } from './services/momo.service';
import { PaymentController } from './controllers/payment.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Order]), HttpModule],
  controllers: [PaymentController],
  providers: [PaymentService, MomoService],
  exports: [PaymentService, MomoService],
})
export class PaymentModule {}
