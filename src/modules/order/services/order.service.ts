import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
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
import { QueueService } from '../../queue/queue.service';
import { MailerService } from '@nestjs-modules/mailer';
import { CouponService } from '../../coupon/coupon.service';
import { CartService } from '../../cart/cart.service';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

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
    private readonly queueService: QueueService,
    private readonly mailerService: MailerService,
    private readonly couponService: CouponService,
    private readonly cartService: CartService,
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

    // Xử lý coupon discount nếu có
    let discount = 0;
    if (dto.couponCode) {
      try {
        const coupon = await this.couponService.validateCoupon(dto.couponCode, userId, computedTotal);
        
        // Tính discount dựa trên loại coupon
        if (coupon.discountType === 'PERCENT') {
          discount = (computedTotal * coupon.discountValue) / 100;
          // Apply max discount limit if exists
          if (coupon.maxDiscountAmount && discount > coupon.maxDiscountAmount) {
            discount = coupon.maxDiscountAmount;
          }
        } else {
          // FIXED discount
          discount = coupon.discountValue;
        }
        
        // Discount cannot exceed order amount
        discount = Math.min(discount, computedTotal);
      } catch (error) {
        this.logger.warn(`Invalid coupon code: ${dto.couponCode}`, error.message);
        // Continue without discount if coupon is invalid
      }
    }

    const expectedTotal = computedTotal - discount;
    const providedCents = Math.round(Number(dto.totalAmount) * 100);
    const expectedCents = Math.round(expectedTotal * 100);
    
    if (providedCents !== expectedCents) {
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
        discount,
        expectedTotal,
        expectedCents,
        couponCode: dto.couponCode,
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
        totalAmount: expectedTotal, // Lưu tổng sau khi trừ discount
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

    // Xóa chỉ các sản phẩm đã đặt hàng khỏi giỏ hàng (không xóa toàn bộ)
    try {
      for (const item of dto.items) {
        await this.cartService.removeItem(userId, item.variantId);
      }
      this.logger.log(`Removed ${dto.items.length} items from cart for user ${userId} after successful order`);
    } catch (error) {
      this.logger.warn(`Failed to remove items from cart for user ${userId}:`, error.message);
      // Không throw error vì order đã tạo thành công
    }

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
      relations: ['user', 'shippingAddress', 'items'],
    });
    return { data, total, page, limit };
  }
  async findByUser(userId: string, { page = 1, limit = 10 }: { page?: number; limit?: number } = {}) {
    const [data, total] = await this.orderRepository.findAndCount({
      where: { userId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
      relations: ['shippingAddress', 'items', 'items.variant', 'items.variant.product', 'items.variant.product.images', 'items.variant.color', 'items.variant.size'],
    });
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Order | null> {
    return await this.orderRepository.findOne({ 
      where: { id },
      relations: ['user', 'shippingAddress', 'items', 'items.variant', 'items.variant.product'],
    });
  }
  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    const order = await this.orderRepository.findOne({ 
      where: { id },
      relations: ['user']
    });
    if (!order) return null;
    const allowed: Record<string, string[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED, OrderStatus.PAID],
      [OrderStatus.PROCESSING]: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.PAID]: [OrderStatus.SHIPPED, OrderStatus.REFUNDED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
      [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
      [OrderStatus.COMPLETED]: [],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.REFUNDED]: [],
    };
    const allowedNext = allowed[order.status] || [];
    if (!allowedNext.includes(status)) throw new BadRequestException('Invalid status transition');

    const oldStatus = order.status;
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

    // Gửi email thông báo khi trạng thái thay đổi (chỉ khi status thực sự thay đổi)
    if (oldStatus !== status && order.user?.email) {
      const emailData = {
        to: order.user.email,
        customerName: order.user.name || order.user.email,
        orderId: id,
        status: status,
        orderTotal: order.totalAmount || 0,
      };

      try {
        await this.queueService.addOrderStatusEmailJob(emailData);
        this.logger.debug(`✅ Email queued for order ${id} status change`);
      } catch (error: any) {
        // Nếu queue fail (Redis không có), thử gửi trực tiếp
        if (error?.code === 'ECONNREFUSED' || error?.message?.includes('ECONNREFUSED') || error?.message?.includes('redis')) {
          this.logger.warn(`⚠️ Redis unavailable, sending email directly for order ${id}`);
          try {
            await this.sendEmailDirectly(
              emailData.to,
              emailData.customerName,
              emailData.orderId,
              emailData.status,
              emailData.orderTotal
            );
            this.logger.log(`✅ Email sent directly (Redis unavailable) for order ${id}`);
          } catch (directError: any) {
            // Log lỗi nhưng không throw để không ảnh hưởng đến việc update status
            this.logger.error(`❌ Failed to send email (both queue and direct):`, directError);
          }
        } else {
          this.logger.error(`❌ Failed to queue order status email:`, error);
        }
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

  // Helper: Gửi email trực tiếp (fallback khi queue không hoạt động)
  private async sendEmailDirectly(to: string, customerName: string, orderId: string, status: string, orderTotal: number): Promise<void> {
    const statusMap: Record<string, string> = {
      'PENDING': 'Đang chờ xử lý',
      'PROCESSING': 'Đang xử lý',
      'PAID': 'Đã thanh toán',
      'SHIPPED': 'Đã giao hàng',
      'DELIVERED': 'Đã nhận hàng',
      'COMPLETED': 'Hoàn thành',
      'CANCELLED': 'Đã hủy',
      'REFUNDED': 'Đã hoàn tiền',
    };

    const statusText = statusMap[status] || status;

    await this.mailerService.sendMail({
      to,
      subject: `Thông báo cập nhật trạng thái đơn hàng #${orderId}`,
      template: 'order-status',
      context: {
        customerName: customerName || 'Quý khách',
        orderId,
        status: statusText,
        orderTotal: orderTotal.toLocaleString('vi-VN'),
      },
    });
  }

  // Gửi email thông báo trạng thái đơn hàng thủ công (không cần đổi status)
  async sendOrderStatusEmail(id: string): Promise<{ success: boolean; message: string }> {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order.user?.email) {
      throw new BadRequestException('Order does not have customer email');
    }

    const emailData = {
      to: order.user.email,
      customerName: order.user.name || order.user.email,
      orderId: id,
      status: order.status,
      orderTotal: order.totalAmount || 0,
    };

    // Thử gửi qua queue trước
    try {
      await this.queueService.addOrderStatusEmailJob(emailData);
      this.logger.log(`✅ Email queued successfully for order ${id}`);
      return {
        success: true,
        message: `Email đã được gửi thành công đến ${order.user.email}`,
      };
    } catch (error: any) {
      this.logger.warn(`⚠️ Queue failed, trying direct email send:`, error);
      
      // Nếu queue fail (Redis không có), thử gửi trực tiếp
      if (error?.code === 'ECONNREFUSED' || error?.message?.includes('ECONNREFUSED') || error?.message?.includes('redis')) {
        try {
          await this.sendEmailDirectly(
            emailData.to,
            emailData.customerName,
            emailData.orderId,
            emailData.status,
            emailData.orderTotal
          );
          this.logger.log(`✅ Email sent directly (Redis unavailable) for order ${id}`);
          return {
            success: true,
            message: `Email đã được gửi trực tiếp đến ${order.user.email} (Redis không khả dụng, đã gửi trực tiếp)`,
          };
        } catch (directError: any) {
          this.logger.error(`❌ Direct email send also failed:`, directError);
          throw new BadRequestException(
            'Không thể gửi email. Vui lòng kiểm tra:\n' +
            '1. Cấu hình email trong .env (SMTP settings)\n' +
            '2. Hoặc cài đặt Redis để sử dụng queue system\n' +
            `Chi tiết lỗi: ${directError?.message || 'Unknown error'}`
          );
        }
      }
      
      // Lỗi khác
      throw new BadRequestException(`Không thể gửi email: ${error?.message || 'Vui lòng thử lại sau.'}`);
    }
  }
}
