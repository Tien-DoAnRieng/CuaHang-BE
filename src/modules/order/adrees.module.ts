import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressController } from './controllers/address.controller';
import { AddressService } from './services/address.service';
import { Address } from '../../shared/schemas/entities/address.entity';
import { Order } from '../../shared/schemas/entities/order.entity';
import { OrderItem } from '../../shared/schemas/entities/order-item.entity';
import { Payment } from '../../shared/schemas/entities/payment.entity';
import { User } from '../../shared/schemas/entities/user.entity';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';

@Module({
  // Register OrderItem, Payment and User repositories so OrderService can inject them
  imports: [TypeOrmModule.forFeature([Address, Order, OrderItem, Payment, User])],
  controllers: [AddressController, OrderController],
  providers: [AddressService, OrderService],
  exports: [AddressService, OrderService],
})
export class AddressModule {}
