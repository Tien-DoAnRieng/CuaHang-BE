import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressController } from './controllers/address.controller';
import { AddressService } from './services/address.service';
import { Address } from '../../shared/schemas/entities/address.entity';
import { Order } from '../../shared/schemas/entities/order.entity';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';

@Module({
  imports: [TypeOrmModule.forFeature([Address, Order])],
  controllers: [AddressController, OrderController],
  providers: [AddressService, OrderService],
  exports: [AddressService, OrderService],
})
export class AddressModule {}
