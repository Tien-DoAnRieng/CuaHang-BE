import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger, BadGatewayException } from '@nestjs/common';
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
import { MembershipService } from '../../member-type/membership.service';
import { Coupon } from '../../../shared/schemas/entities/coupon.entity';
import { UserVoucher } from '../../../shared/schemas/entities/user-voucher.entity';
import { GhnService } from '../../ghn/ghn.service';

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
    private readonly membershipService: MembershipService,
    private readonly ghnService: GhnService,
  ) {}
  async placeOrder(dto: CreateOrderDto, userId: string): Promise<Order> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    const address = await this.addressRepository.findOne({ where: { id: dto.shippingAddressId } });
    if (!address) throw new BadRequestException('Shipping address not found');
    if (address.userId !== userId) throw new ForbiddenException('Shipping address does not belong to user');
    if (!Array.isArray(dto.items) || dto.items.length === 0) throw new BadRequestException('No items provided');
    const variantIds = dto.items.map(i => i.variantId);
    const variants = await this.variantRepository.find({ 
      where: { id: In(variantIds) }, 
      relations: ['product', 'product.flashSales', 'product.flashSales.items'] 
    });
    const variantMap = new Map(variants.map(v => [v.id, v]));
    
    // Helper: Get price for variant (check flash sale first)
    const getVariantPrice = (variant: ProductVariant): number => {
      const now = new Date();
      
      // Check flash sale
      if (variant.product && variant.product.flashSales) {
        const activeFlashSale = variant.product.flashSales.find((fs: any) => {
          if (!fs.isActive) return false;
          const startTime = new Date(fs.startTime);
          const endTime = new Date(fs.endTime);
          return now >= startTime && now <= endTime;
        });

        if (activeFlashSale && activeFlashSale.items) {
          const flashSaleItem = activeFlashSale.items.find((fsi: any) => 
            fsi.productVariantId === variant.id
          );

          if (flashSaleItem && flashSaleItem.salePrice) {
            return Number(flashSaleItem.salePrice);
          }
        }
      }
      
      // Fallback: priceOverride or product price
      const rawPrice = variant.priceOverride ?? variant.product?.price;
      return parseFloat(String(rawPrice));
    };
    
    let computedTotal = 0;
    for (const it of dto.items) {
      const v = variantMap.get(it.variantId);
      if (!v) throw new BadRequestException(`Variant not found: ${it.variantId}`);
      
      const priceNum = getVariantPrice(v);
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
        this.logger.warn(`Invalid coupon code: ${dto.couponCode}`, (error as any)?.message);
        // Continue without discount if coupon is invalid
      }
    }

    // Xử lý hoàn tiền / cashback discount nếu có
    let cashbackDiscount = 0;
    if (dto.useCashbackAmount && dto.useCashbackAmount > 0) {
      const userBalance = Number(user.cashbackBalance || 0);
      if (dto.useCashbackAmount > userBalance) {
        throw new BadRequestException(
          `Số dư hoàn tiền không đủ (Hiện có: ${userBalance.toLocaleString('vi-VN')}đ, Yêu cầu: ${dto.useCashbackAmount.toLocaleString('vi-VN')}đ)`,
        );
      }
      cashbackDiscount = Math.min(dto.useCashbackAmount, Math.max(0, computedTotal - discount));
    }

    const shippingFee = Math.max(0, Number(dto.shippingFee || 0));
    const expectedTotal = Math.max(0, computedTotal - discount - cashbackDiscount + shippingFee);
    const providedCents = Math.round(Number(dto.totalAmount) * 100);
    const expectedCents = Math.round(expectedTotal * 100);
    
    if (providedCents !== expectedCents) {
      const breakdown = dto.items.map(it => {
        const v = variantMap.get(it.variantId);
        const priceNum = v ? getVariantPrice(v) : null;
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
        cashbackDiscount,
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
        totalAmount: expectedTotal, // Lưu tổng sau khi trừ discount & cashback
        status: OrderStatus.PENDING,
        paymentMethod: dto.paymentMethod,
        shippingAddressId: dto.shippingAddressId,
        shippingFee,
        ghnOrderCode: null,
        ghnStatus: null,
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

      // Update coupon usedCount and user voucher usage if code is provided
      if (dto.couponCode) {
        const couponRepo = manager.getRepository(Coupon);
        const userVoucherRepo = manager.getRepository(UserVoucher);

        const coupon = await couponRepo.findOne({ where: { code: dto.couponCode.toUpperCase() } });
        if (coupon) {
          coupon.usedCount = (coupon.usedCount || 0) + 1;
          await couponRepo.save(coupon);

          const userVoucher = await userVoucherRepo.findOne({
            where: { coupon: { id: coupon.id }, user: { id: userId } }
          });
          if (userVoucher) {
            userVoucher.isUsed = true;
            userVoucher.usedAt = new Date();
            await userVoucherRepo.save(userVoucher);
          }
        }
      }

      return savedOrder;
    });

    // Trừ số dư cashback của người dùng nếu có áp dụng
    if (cashbackDiscount > 0) {
      try {
        await this.membershipService.spendCashback(userId, cashbackDiscount, saved.id);
      } catch (error: any) {
        this.logger.error(`Failed to deduct cashback for order ${saved.id}:`, error?.message || error);
        throw error;
      }
    }

    // Xóa chỉ các sản phẩm đã đặt hàng khỏi giỏ hàng (không xóa toàn bộ)
    try {
      for (const item of dto.items) {
        await this.cartService.removeItem(userId, item.variantId);
      }
      this.logger.log(`Removed ${dto.items.length} items from cart for user ${userId} after successful order`);
    } catch (error) {
      this.logger.warn(`Failed to remove items from cart for user ${userId}:`, (error as any)?.message);
      // Không throw error vì order đã tạo thành công
    }

    const orderWithItems = await this.orderRepository.findOne({ 
      where: { id: saved.id }, 
      relations: ['items', 'payments', 'shippingAddress', 'user'] 
    });
    if (!orderWithItems) throw new Error('Order not found after save');

    // Gửi email xác nhận đơn hàng khi đặt hàng thành công
    if (orderWithItems.user?.email) {
      const emailData = {
        to: orderWithItems.user.email,
        customerName: orderWithItems.user.name || orderWithItems.user.email,
        orderId: saved.id,
        status: OrderStatus.PENDING,
        orderTotal: orderWithItems.totalAmount || 0,
      };

      try {
        await this.queueService.addOrderStatusEmailJob(emailData);
        this.logger.debug(`✅ Order confirmation email queued for order ${saved.id}`);
      } catch (error: any) {
        // Nếu queue fail (Redis không có), thử gửi trực tiếp
        if (error?.code === 'ECONNREFUSED' || error?.message?.includes('ECONNREFUSED') || error?.message?.includes('redis')) {
          this.logger.warn(`⚠️ Redis unavailable, sending order confirmation email directly for order ${saved.id}`);
          try {
            await this.sendEmailDirectly(
              emailData.to,
              emailData.customerName,
              emailData.orderId,
              emailData.status,
              emailData.orderTotal
            );
            this.logger.log(`✅ Order confirmation email sent directly (Redis unavailable) for order ${saved.id}`);
          } catch (directError: any) {
            // Log lỗi nhưng không throw để không ảnh hưởng đến việc tạo order
            this.logger.error(`❌ Failed to send order confirmation email (both queue and direct):`, directError);
          }
        } else {
          this.logger.error(`❌ Failed to queue order confirmation email:`, error);
        }
      }
    }

    return orderWithItems;
  }

  async createGhnShipment(orderId: string): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.variant', 'items.variant.product', 'shippingAddress'],
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.ghnOrderCode) throw new BadRequestException('GHN shipment already created');
    if ([OrderStatus.CANCELLED, OrderStatus.REFUNDED, OrderStatus.DELIVERED, OrderStatus.COMPLETED].includes(order.status as OrderStatus)) {
      throw new BadRequestException('Order is not eligible for GHN shipment');
    }

    const address = order.shippingAddress;
    if (!address) throw new BadRequestException('Shipping address not found');

    const fromName = process.env.GHN_FROM_NAME?.trim() || 'Shop';
    const fromPhone = process.env.GHN_FROM_PHONE?.trim() || address.phone;
    const fromAddress = process.env.GHN_FROM_ADDRESS?.trim() || address.fullAddress;
    const fromWardName = process.env.GHN_FROM_WARD_NAME?.trim() || address.ward;
    const fromDistrictName = process.env.GHN_FROM_DISTRICT_NAME?.trim() || address.district;
    const fromProvinceName = process.env.GHN_FROM_PROVINCE_NAME?.trim() || address.province;

    if (!process.env.GHN_FROM_DISTRICT_ID || !process.env.GHN_FROM_WARD_CODE) {
      throw new BadGatewayException(
        'GHN shop address is not configured. Please set GHN_FROM_DISTRICT_ID and GHN_FROM_WARD_CODE in backend/.env.',
      );
    }

    const defaultWeight = Number(process.env.GHN_DEFAULT_WEIGHT || 500);
    const targetLocation = await this.ghnService.resolveShippingLocation(address.province, address.district, address.ward);
    const paymentMethod = String(order.paymentMethod || '').toUpperCase();
    const orderStatus = String(order.status || '').toUpperCase();
    const isPaidOrder = orderStatus === OrderStatus.PAID || orderStatus === OrderStatus.SHIPPED || orderStatus === OrderStatus.DELIVERED || orderStatus === OrderStatus.COMPLETED;
    const isCashOnDelivery = paymentMethod === 'COD';
    const codAmount = isPaidOrder ? 0 : isCashOnDelivery ? Number(order.totalAmount) : 0;

    const ghnOrder = await this.ghnService.createOrder({
      shop_id: Number(process.env.GHN_SHOP_ID),
      payment_type_id: 2,
      note: `Order ${order.id}`,
      required_note: 'KHONGCHOXEMHANG',
      from_name: fromName,
      from_phone: fromPhone,
      from_address: fromAddress,
      from_ward_code: process.env.GHN_FROM_WARD_CODE?.trim(),
      from_district_id: Number(process.env.GHN_FROM_DISTRICT_ID),
      from_ward_name: fromWardName,
      from_district_name: fromDistrictName,
      from_province_name: fromProvinceName,
      to_name: address.recipientName,
      to_phone: address.phone,
      to_address: address.fullAddress,
      to_ward_code: targetLocation.wardCode,
      to_district_id: targetLocation.districtId,
      to_ward_name: targetLocation.wardName,
      to_district_name: targetLocation.districtName,
      to_province_name: targetLocation.provinceName,
      cod_amount: codAmount,
      content: `Order ${order.id}`,
      weight: defaultWeight,
      length: Number(process.env.GHN_DEFAULT_LENGTH || 20),
      width: Number(process.env.GHN_DEFAULT_WIDTH || 15),
      height: Number(process.env.GHN_DEFAULT_HEIGHT || 10),
      service_type_id: 2,
      insurance_value: Math.min(Number(order.totalAmount), 5000000),
      items: order.items.map((item) => ({
        name: item.variant?.product?.name || `Product ${item.variantId}`,
        code: item.variantId,
        quantity: item.quantity,
        price: Number(item.priceAtTime),
        weight: defaultWeight,
      })),
    });

    order.ghnOrderCode = ghnOrder.order_code || null;
    order.ghnStatus = order.ghnOrderCode ? 'READY_TO_PICK' : 'FAILED';
    return this.orderRepository.save(order);
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

    // Hoàn lại tiền cashback đã sử dụng và thu hồi cashback tích lũy nếu có
    if (order.userId) {
      try {
        await this.membershipService.refundSpentCashback(order.userId, order.id);
        await this.membershipService.revokeOrderCashback(order.id);
      } catch (err: any) {
        this.logger.error(`Failed to handle cashback refund/revoke for cancelled order ${id}:`, err?.message || err);
      }
    }

    return this.orderRepository.findOne({ where: { id }, relations: ['items'] }) as Promise<Order>;
  }
  async findAll({ 
    search, 
    page = 1, 
    limit = 10, 
    sellerId 
  }: { 
    search?: string; 
    page?: number; 
    limit?: number; 
    sellerId?: string;
  }) {
    // Nếu có sellerId, chỉ lấy đơn hàng chứa sản phẩm của seller đó
    if (sellerId) {
      // Bước 1: Tìm các order IDs có chứa sản phẩm của seller
      const orderIdsResult = await this.orderRepository
        .createQueryBuilder('order')
        .leftJoin('order.items', 'items')
        .leftJoin('items.variant', 'variant')
        .leftJoin('variant.product', 'product')
        .where('product.sellerId = :sellerId', { sellerId })
        .select('DISTINCT order.id', 'id')
        .getRawMany();
      
      const orderIds = orderIdsResult.map((row: any) => row.id).filter((id: any) => id != null);
      
      if (orderIds.length === 0) {
        return { data: [], total: 0, page, limit };
      }
      
      // Bước 2: Query orders với các IDs đã tìm được
      const whereConditions: any[] = [{ id: In(orderIds) }];
      if (search) {
        whereConditions.push({ status: Like(`%${search}%`) });
      }
      
      const [data, total] = await this.orderRepository.findAndCount({
        where: whereConditions.length > 1 ? whereConditions : whereConditions[0],
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
        relations: ['user', 'shippingAddress', 'items', 'items.variant', 'items.variant.product'],
      });
      
      return { data, total, page, limit };
    }
    
    // Admin: lấy tất cả đơn hàng
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
      [OrderStatus.PENDING]:    [OrderStatus.PROCESSING, OrderStatus.CANCELLED, OrderStatus.PAID],
      [OrderStatus.PROCESSING]: [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.PAID]:       [OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.REFUNDED], // Admin có thể skip bước
      [OrderStatus.SHIPPED]:    [OrderStatus.DELIVERED, OrderStatus.COMPLETED, OrderStatus.CANCELLED],                     // Admin có thể skip DELIVERED
      [OrderStatus.DELIVERED]:  [OrderStatus.COMPLETED, OrderStatus.REFUNDED],
      [OrderStatus.COMPLETED]:  [],
      [OrderStatus.CANCELLED]:  [],
      [OrderStatus.REFUNDED]:   [],
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
    if (oldStatus !== status) {
      this.logger.log(`📧 Order ${id} status changed from ${oldStatus} to ${status}`);
      
      // Reload order với user relation để đảm bảo có user data
      const orderWithUser = await this.orderRepository.findOne({ 
        where: { id }, 
        relations: ['user'] 
      });
      
      if (!orderWithUser) {
        this.logger.warn(`⚠️ Cannot send email for order ${id}: Order not found after update`);
        return saved;
      }
      
      if (orderWithUser.user?.email) {
        const emailData = {
          to: orderWithUser.user.email,
          customerName: orderWithUser.user.name || orderWithUser.user.email,
          orderId: id,
          status: status,
          orderTotal: orderWithUser.totalAmount || 0,
        };

        this.logger.log(`📧 [updateStatus] Preparing to send order status email to ${emailData.to} for order ${id}`);
        this.logger.log(`📧 [updateStatus] MailerService available: ${!!this.mailerService}`);
        this.logger.log(`📧 [updateStatus] QueueService available: ${!!this.queueService}`);

        // Luôn thử gửi trực tiếp để đảm bảo email được gửi (bỏ qua queue)
        try {
          this.logger.log(`📧 [updateStatus] Sending email directly for order ${id} (bypassing queue)`);
          await this.sendEmailDirectly(
            emailData.to,
            emailData.customerName,
            emailData.orderId,
            emailData.status,
            emailData.orderTotal
          );
          this.logger.log(`✅ [updateStatus] Email sent directly for order ${id} - Status: ${oldStatus} → ${status}`);
        } catch (directError: any) {
          // Log lỗi nhưng không throw để không ảnh hưởng đến việc update status
          this.logger.error(`❌ [updateStatus] Failed to send email directly for order ${id}:`, directError?.message || directError);
          this.logger.error(`❌ [updateStatus] Error stack:`, directError?.stack);
          if (directError?.response) {
            this.logger.error(`❌ [updateStatus] SMTP Response:`, directError.response);
          }
          if (directError?.code) {
            this.logger.error(`❌ [updateStatus] Error code:`, directError.code);
          }
        }
      } else {
        this.logger.warn(`⚠️ [updateStatus] Cannot send email for order ${id}: User email not found. Order user:`, orderWithUser.user ? 'exists but no email' : 'null');
      }
    } else {
      this.logger.debug(`ℹ️ Order ${id} status unchanged (${status}), skipping email`);
    }

    // Xử lý Cập nhật Hạng Thành viên & Hoàn tiền Cashback khi Đơn hàng HOÀN THÀNH
    if (saved.userId && status === OrderStatus.COMPLETED) {
      try {
        await this.membershipService.recalculateUserTier(saved.userId);
        await this.membershipService.processOrderCashback(saved);
      } catch (err: any) {
        this.logger.error(`❌ [updateStatus] Failed to process membership tier/cashback for order ${id}:`, err?.message || err);
      }
    } else if (saved.userId && (status === OrderStatus.CANCELLED || status === OrderStatus.REFUNDED)) {
      try {
        await this.membershipService.refundSpentCashback(saved.userId, saved.id);
        await this.membershipService.revokeOrderCashback(saved.id);
        if (oldStatus === OrderStatus.COMPLETED) {
          await this.membershipService.recalculateUserTier(saved.userId);
        }
      } catch (err: any) {
        this.logger.error(`❌ [updateStatus] Failed to process cashback/tier on cancellation/refund for order ${id}:`, err?.message || err);
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
    try {
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

      this.logger.log(`📧 [sendEmailDirectly] Starting email send to ${to} for order ${orderId}`);
      this.logger.log(`📧 [sendEmailDirectly] Email data:`, {
        to,
        customerName,
        orderId,
        status: statusText,
        orderTotal,
      });

      // Kiểm tra mailerService có tồn tại không
      if (!this.mailerService) {
        this.logger.error(`❌ [sendEmailDirectly] MailerService is not available!`);
        throw new Error('MailerService is not available');
      }

      const emailOptions = {
        to,
        subject: `Thông báo cập nhật trạng thái đơn hàng #${orderId}`,
        template: 'order-status',
        context: {
          customerName: customerName || 'Quý khách',
          orderId,
          status: statusText,
          orderTotal: orderTotal.toLocaleString('vi-VN'),
        },
      };

      this.logger.log(`📧 [sendEmailDirectly] Email options:`, JSON.stringify(emailOptions, null, 2));

      try {
        const result = await this.mailerService.sendMail(emailOptions);
        this.logger.log(`✅ [sendEmailDirectly] Email sent successfully to ${to} for order ${orderId}`);
        this.logger.log(`✅ [sendEmailDirectly] Send result:`, result);
      } catch (tmplError) {
        this.logger.warn(`⚠️ [sendEmailDirectly] Template send failed, using HTML fallback:`, tmplError);
        const fallbackResult = await this.mailerService.sendMail({
          to,
          subject: `Thông báo cập nhật trạng thái đơn hàng #${orderId}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
              <h2 style="color: #4f46e5;">Thông báo cập nhật đơn hàng</h2>
              <p>Xin chào <strong>${customerName || 'Quý khách'}</strong>,</p>
              <p>Chúng tôi xin thông báo về tình trạng đơn hàng của bạn:</p>
              <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #e2e8f0;">
                <p style="margin: 5px 0;"><strong>Mã đơn hàng:</strong> #${orderId}</p>
                <p style="margin: 5px 0;"><strong>Trạng thái:</strong> <span style="background: #4f46e5; color: white; padding: 3px 8px; border-radius: 12px; font-size: 13px;">${statusText}</span></p>
                <p style="margin: 5px 0;"><strong>Tổng tiền:</strong> ${orderTotal.toLocaleString('vi-VN')}₫</p>
              </div>
              <p>Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi!</p>
              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
              <p style="color: #64748b; font-size: 12px;">Đây là email tự động, vui lòng không trả lời email này.</p>
            </div>
          `,
        });
        this.logger.log(`✅ [sendEmailDirectly] Fallback HTML email sent successfully to ${to}`, fallbackResult);
      }
    } catch (error: any) {
      this.logger.error(`❌ [sendEmailDirectly] Failed to send email directly to ${to} for order ${orderId}`);
      this.logger.error(`❌ [sendEmailDirectly] Error message:`, error?.message);
      this.logger.error(`❌ [sendEmailDirectly] Error stack:`, error?.stack);
      this.logger.error(`❌ [sendEmailDirectly] Full error:`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      throw error;
    }
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
