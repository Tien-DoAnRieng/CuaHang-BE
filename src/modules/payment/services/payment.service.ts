import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../../shared/schemas/entities/payment.entity';
import { Order } from '../../../shared/schemas/entities/order.entity';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
  ) {}

  /** Create a payment for an order. If userId provided, verify ownership. */
  async create(dto: { orderId: string; paymentMethod: string; status?: string }, userId?: string): Promise<Payment> {
    const order = await this.orderRepo.findOne({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Order not found');

    if (userId && order.userId !== userId) {
      throw new ForbiddenException('You cannot create payment for this order');
    }

    const payment = this.paymentRepo.create({
      orderId: dto.orderId,
      paymentMethod: dto.paymentMethod,
      status: dto.status || 'PENDING',
      paymentTime: new Date(),
    } as Partial<Payment>);

    return this.paymentRepo.save(payment);
  }

  /** Get payment by id; include order relation */
  async findOne(id: string): Promise<Payment | null> {
    return this.paymentRepo.findOne({ where: { id }, relations: ['order'] });
  }

  /** List payments belonging to a user (via order.userId) */
  async findByUser(userId: string, { page = 1, limit = 10 }: { page?: number; limit?: number } = {}) {
    const qb = this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.order', 'order')
      .where('order.userId = :userId', { userId })
      .orderBy('payment.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  /** Admin: list all payments with optional search by status */
  async findAll({ search, page = 1, limit = 10 }: { search?: string; page?: number; limit?: number }) {
    const qb = this.paymentRepo.createQueryBuilder('payment').leftJoinAndSelect('payment.order', 'order');
    if (search) qb.where('payment.status LIKE :search', { search: `%${search}%` });
    qb.orderBy('payment.createdAt', 'DESC').skip((page - 1) * limit).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  /** Admin: update payment status */
  async updateStatus(id: string, status: string): Promise<Payment | null> {
    const payment = await this.paymentRepo.findOne({ where: { id } });
    if (!payment) return null;
    payment.status = status;
    payment.paymentTime = new Date();
    return this.paymentRepo.save(payment);
  }
}
