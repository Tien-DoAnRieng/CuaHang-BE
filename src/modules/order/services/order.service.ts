import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Order } from '../../../shared/schemas/entities/order.entity';
import { OrderItem } from '../../../shared/schemas/entities/order-item.entity';
import { Payment } from '../../../shared/schemas/entities/payment.entity';
import { OrderStatus } from '../../../common/enums/order-status.enum';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { User } from '../../../shared/schemas/entities/user.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // User: Place order
  async placeOrder(dto: CreateOrderDto): Promise<Order> {
    // Ensure the user exists before creating the order to avoid FK constraint errors
    const user = await this.userRepository.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    // Create base order
    const order = this.orderRepository.create({ ...dto, status: OrderStatus.PENDING });
    const savedOrder = await this.orderRepository.save(order);

    // If items provided in DTO, persist them into order_items table
    if (Array.isArray(dto.items) && dto.items.length > 0) {
      const itemsToSave = dto.items.map(i => ({
        orderId: savedOrder.id,
        variantId: i.variantId,
        quantity: i.quantity,
        priceAtTime: i.price,
      } as Partial<OrderItem>));

      await this.orderItemRepository.save(itemsToSave as OrderItem[]);
    }

    // Return order with items relation loaded
    const orderWithItems = await this.orderRepository.findOne({ where: { id: savedOrder.id }, relations: ['items'] });
    if (!orderWithItems) throw new Error('Order not found after save');
    return orderWithItems;
  }

  // User: Cancel order
  async cancelOrder(id: string): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) throw new Error('Order not found');
  order.status = OrderStatus.CANCELLED;
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

  // User: Lấy danh sách đơn hàng của 1 user (own orders)
  async findByUser(userId: string, { page = 1, limit = 10 }: { page?: number; limit?: number } = {}) {
    const [data, total] = await this.orderRepository.findAndCount({
      where: { userId },
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

  // Admin: Update order status only
  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) return null;
    order.status = status;
    const saved = await this.orderRepository.save(order);

    // If admin marks order as PAID, propagate to payments
    if (status === OrderStatus.PAID) {
      const payments = await this.paymentRepository.find({ where: { orderId: id } });
      for (const p of payments) {
        p.status = 'COMPLETED';
        p.paymentTime = new Date();
        await this.paymentRepository.save(p);
      }
    }

    return saved;
  }


  // Admin: Delete order
  async remove(id: string): Promise<void> {
    // Delete related order_items and payments first to avoid FK constraint errors
    await this.orderRepository.manager.transaction(async (manager) => {
      await manager.delete(OrderItem, { orderId: id });
      await manager.delete(Payment, { orderId: id });
      await manager.delete(Order, { id });
    });
  }
}
