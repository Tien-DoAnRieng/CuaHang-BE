import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Order } from '../../../shared/schemas/entities/order.entity';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  // User: Place order
  async placeOrder(dto: CreateOrderDto): Promise<Order> {
    const order = this.orderRepository.create({ ...dto, status: 'PENDING' });
    return await this.orderRepository.save(order);
  }

  // User: Cancel order
  async cancelOrder(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) throw new Error('Order not found');
    order.status = 'CANCELLED';
    return await this.orderRepository.save(order);
  }

  // Admin: List orders with search & pagination
  async findAll({ search, page = 1, limit = 10 }: { search?: string; page?: number; limit?: number }) {
    const where = search ? [{ status: Like(`%${search}%`) }] : {};
    const [data, total] = await this.orderRepository.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit };
  }

  // Admin: Get order by id
  async findOne(id: string): Promise<Order | null> {
    return await this.orderRepository.findOne({ where: { id } });
  }

  // Admin: Update order
  async update(id: string, dto: UpdateOrderDto): Promise<Order | null> {
    await this.orderRepository.update(id, dto);
    return await this.findOne(id);
  }

  // Admin: Delete order
  async remove(id: string): Promise<void> {
    await this.orderRepository.delete(id);
  }
}
