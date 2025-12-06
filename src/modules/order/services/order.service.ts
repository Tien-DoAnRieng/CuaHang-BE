import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Order } from '../../../shared/schemas/entities/order.entity';
import { OrderItem } from '../../../shared/schemas/entities/order-item.entity';
import { Payment } from '../../../shared/schemas/entities/payment.entity';
import { OrderStatus } from '../../../common/enums/order-status.enum';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { User } from '../../../shared/schemas/entities/user.entity';
import { ProductVariant } from '../../../shared/schemas/entities/product-variant.entity';
import { Product } from '../../../shared/schemas/entities/product.entity';
import { Address } from '../../../shared/schemas/entities/address.entity';

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
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Address)
    private readonly addressRepository: Repository<Address>,
  ) {}
  async placeOrder(dto: CreateOrderDto, userId: string): Promise<Order> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const address = await this.addressRepository.findOne({ where: { id: dto.shippingAddressId } });
    if (!address) throw new BadRequestException('Shipping address not found');
    if (address.userId !== userId) throw new ForbiddenException('Shipping address does not belong to user');
    if (!Array.isArray(dto.items) || dto.items.length === 0) throw new BadRequestException('No items provided');
    const variantIds = dto.items.map(i => i.variantId);
    const variants = await this.variantRepository.find({ where: { id: In(variantIds) }, relations: ['product'] });
    const variantMap = new Map(variants.map(v => [v.id, v]));
    let computedTotal = 0;
    for (const it of dto.items) {
      const v = variantMap.get(it.variantId);
      if (!v) throw new BadRequestException(`Variant not found: ${it.variantId}`);
      // product.price (decimal) may come as string from DB; normalize with parseFloat
      const rawPrice = v.priceOverride ?? v.product?.price;
      const priceNum = parseFloat(String(rawPrice));
      if (Number.isNaN(priceNum)) throw new BadRequestException(`Price not available for variant ${it.variantId}`);
      if (v.stockQuantity < it.quantity) throw new BadRequestException(`Insufficient stock for variant ${it.variantId}`);
      computedTotal += priceNum * Number(it.quantity);
    }
    const providedCents = Math.round(Number(dto.totalAmount) * 100);
    const computedCents = Math.round(computedTotal * 100);
    if (providedCents !== computedCents) {
      const breakdown = dto.items.map(it => {
        const v = variantMap.get(it.variantId);
        const rawPrice = v ? (v.priceOverride ?? v.product?.price) : null;
        const priceNum = rawPrice != null ? parseFloat(String(rawPrice)) : null;
        const qty = Number(it.quantity || 0);
        return {
          variantId: it.variantId,
          productId: it.productId,
          price: priceNum,
          quantity: qty,
          subtotal: priceNum != null ? Math.round(priceNum * qty * 100) / 100 : null,
        };
      });
      console.error('[OrderService] Total mismatch', {
        provided: Number(dto.totalAmount),
        providedCents,
        computed: computedTotal,
        computedCents,
        breakdown,
      });

      throw new BadRequestException('Total amount mismatch');
    }
    const saved = await this.orderRepository.manager.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const itemRepo = manager.getRepository(OrderItem);
      const variantRepo = manager.getRepository(ProductVariant);

      const orderEntity = orderRepo.create({
        userId,
        totalAmount: computedTotal,
        status: OrderStatus.PENDING,
        paymentMethod: dto.paymentMethod,
        shippingAddressId: dto.shippingAddressId,
      } as Partial<Order>);

      const savedOrder = await orderRepo.save(orderEntity);

      const itemsToSave: Partial<OrderItem>[] = [];
      for (const it of dto.items) {
        const v = variantMap.get(it.variantId)!;
        const price = (v.priceOverride ?? v.product?.price) as number;
        itemsToSave.push({
          orderId: savedOrder.id,
          variantId: it.variantId,
          quantity: it.quantity,
          priceAtTime: price,
        });
        const current = await variantRepo.findOne({ where: { id: it.variantId } });
        if (!current) throw new BadRequestException(`Variant missing during commit: ${it.variantId}`);
        if (current.stockQuantity < it.quantity) throw new BadRequestException(`Insufficient stock for variant ${it.variantId}`);
        current.stockQuantity = current.stockQuantity - it.quantity;
        await variantRepo.save(current);
      }

      await itemRepo.save(itemsToSave as OrderItem[]);
      return savedOrder;
    });

    const orderWithItems = await this.orderRepository.findOne({ where: { id: saved.id }, relations: ['items', 'payments', 'shippingAddress'] });
    if (!orderWithItems) throw new Error('Order not found after save');
    return orderWithItems;
  }

  async cancelOrder(id: string, userId: string, isAdmin = false): Promise<Order> {
    const order = await this.orderRepository.findOne({ where: { id }, relations: ['items'] });
    if (!order) throw new NotFoundException('Order not found');
    if (!isAdmin && order.userId !== userId) throw new ForbiddenException('Not allowed to cancel this order');

    const cancellable = [OrderStatus.PENDING, OrderStatus.PROCESSING];
    if (!cancellable.includes(order.status as OrderStatus)) throw new BadRequestException('Cannot cancel order in current status');
    await this.orderRepository.manager.transaction(async (manager) => {
      const variantRepo = manager.getRepository(ProductVariant);
      const itemRepo = manager.getRepository(OrderItem);
      const orderRepo = manager.getRepository(Order);
      for (const it of order.items || []) {
        const v = await variantRepo.findOne({ where: { id: it.variantId } });
        if (v) {
          v.stockQuantity = (v.stockQuantity || 0) + (it.quantity || 0);
          await variantRepo.save(v);
        }
      }

      order.status = OrderStatus.CANCELLED;
      await orderRepo.save(order);
    });

    return this.orderRepository.findOne({ where: { id }, relations: ['items'] }) as Promise<Order>;
  }
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
  async findByUser(userId: string, { page = 1, limit = 10 }: { page?: number; limit?: number } = {}) {
    const [data, total] = await this.orderRepository.findAndCount({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Order | null> {
    return await this.orderRepository.findOne({ where: { id } });
  }
  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const order = await this.orderRepository.findOne({ where: { id } });
    if (!order) return null;
    const allowed: Record<string, string[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED, OrderStatus.PAID],
      [OrderStatus.PROCESSING]: [OrderStatus.PAID, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.REFUNDED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };
    const allowedNext = allowed[order.status] || [];
    if (!allowedNext.includes(status)) throw new BadRequestException('Invalid status transition');

    order.status = status;
    const saved = await this.orderRepository.save(order);
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

  async remove(id: string): Promise<void> {
    await this.orderRepository.manager.transaction(async (manager) => {
      await manager.delete(OrderItem, { orderId: id });
      await manager.delete(Payment, { orderId: id });
      await manager.delete(Order, { id });
    });
  }
}
