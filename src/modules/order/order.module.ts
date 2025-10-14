import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../../shared/schemas/entities/order.entity';
import { OrderItem } from '../../shared/schemas/entities/order-item.entity';
import { Address } from '../../shared/schemas/entities/address.entity';
import { Payment } from '../../shared/schemas/entities/payment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Address,
      Payment
    ])
  ],
  exports: [TypeOrmModule]
})
export class OrderModule {}