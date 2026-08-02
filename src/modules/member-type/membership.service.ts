import { Injectable, Logger, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { User } from '../../shared/schemas/entities/user.entity';
import { MemberType } from '../../shared/schemas/entities/member-type.entity';
import { Order } from '../../shared/schemas/entities/order.entity';
import { MembershipHistory } from '../../shared/schemas/entities/membership-history.entity';
import { CashbackTransaction } from '../../shared/schemas/entities/cashback-transaction.entity';
import { UserVoucher } from '../../shared/schemas/entities/user-voucher.entity';
import { Coupon } from '../../shared/schemas/entities/coupon.entity';

@Injectable()
export class MembershipService implements OnModuleInit {
  private readonly logger = new Logger(MembershipService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MemberType)
    private readonly memberTypeRepository: Repository<MemberType>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(MembershipHistory)
    private readonly historyRepository: Repository<MembershipHistory>,
    @InjectRepository(CashbackTransaction)
    private readonly cashbackRepository: Repository<CashbackTransaction>,
    @InjectRepository(UserVoucher)
    private readonly userVoucherRepository: Repository<UserVoucher>,
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) {}

  onModuleInit() {
    this.logger.log('Initializing MembershipService cron scheduler for cashback unlocks...');
    this.unlockPendingCashbacks().catch((err) =>
      this.logger.error('Failed initial cashback unlock job:', err),
    );
    // Runs every hour to check for cashbacks past 7 days
    setInterval(() => {
      this.unlockPendingCashbacks().catch((err) =>
        this.logger.error('Failed periodic cashback unlock job:', err),
      );
    }, 3600000);
  }

  async recalculateAllUsers(): Promise<number> {
    const users = await this.userRepository.find({ select: ['id'] });
    let count = 0;
    for (const u of users) {
      try {
        await this.recalculateUserTier(u.id);
        count++;
      } catch (err: any) {
        this.logger.error(`Failed recalculating tier for user ${u.id}:`, err?.message || err);
      }
    }
    return count;
  }

  /**
   * Recalculates user statistics (completed orders & total spent) and updates Tier accordingly
   */
  async recalculateUserTier(userId: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['memberType'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // 1. Calculate actual completed orders & spent
    const completedOrders = await this.orderRepository.find({
      where: { userId, status: 'COMPLETED' },
    });

    const completedOrdersCount = completedOrders.length;
    const totalSpent = completedOrders.reduce(
      (sum, order) => sum + (Number(order.totalAmount) || 0),
      0,
    );

    // 2. Fetch all MemberTypes ordered by rankLevel DESC
    const memberTypes = await this.memberTypeRepository.find({
      order: { rankLevel: 'DESC' },
    });

    if (!memberTypes.length) {
      this.logger.warn('No MemberTypes found in system!');
      return user;
    }

    // 3. Determine qualifying tier
    let qualifyingTier = memberTypes.find(
      (mt) =>
        totalSpent >= Number(mt.minSpent || 0) &&
        completedOrdersCount >= Number(mt.minOrders || 0),
    );

    if (!qualifyingTier) {
      qualifyingTier = memberTypes[memberTypes.length - 1]; // Default to lowest tier
    }

    const currentTier = user.memberType;
    const isTierChanged = !currentTier || currentTier.id !== qualifyingTier.id;

    // 4. Update User fields
    user.completedOrdersCount = completedOrdersCount;
    user.totalSpent = totalSpent;
    user.memberType = qualifyingTier;

    if (isTierChanged) {
      user.tierUpdatedAt = new Date();
    }

    const updatedUser = await this.userRepository.save(user);

    // 5. Audit History if tier changed
    if (isTierChanged) {
      const reason =
        !currentTier
          ? 'INITIAL_ASSIGNMENT'
          : qualifyingTier.rankLevel > (currentTier.rankLevel || 0)
          ? 'UPGRADE'
          : 'DOWNGRADE';

      const history = this.historyRepository.create({
        user: updatedUser,
        oldMemberType: currentTier || null,
        newMemberType: qualifyingTier,
        spentAmount: totalSpent,
        orderCount: completedOrdersCount,
        changeReason: reason,
      });

      await this.historyRepository.save(history);
      this.logger.log(
        `User ${userId} tier updated: ${currentTier?.name || 'None'} -> ${qualifyingTier.name} (${reason})`,
      );

      // Generate thăng hạng vouchers if user is upgraded
      if (reason === 'UPGRADE') {
        try {
          await this.generateTierVouchers(updatedUser, qualifyingTier);
        } catch (voucherErr: any) {
          this.logger.error(
            `Failed generating thăng hạng vouchers for user ${userId}:`,
            voucherErr?.message || voucherErr,
          );
        }
      }
    }

    return updatedUser;
  }

  /**
   * Automatically generates 5 custom vouchers for the user when they upgrade tier
   */
  async generateTierVouchers(user: User, tier: MemberType): Promise<void> {
    const tierCode = tier.code.toUpperCase();
    
    // Only generate vouchers for SILVER, GOLD, PLATINUM, DIAMOND
    if (!['SILVER', 'GOLD', 'PLATINUM', 'DIAMOND'].includes(tierCode)) {
      return;
    }

    const config: Record<string, { minOrder: number; discounts: number[] }> = {
      SILVER: { minOrder: 200000, discounts: [10, 15, 20, 25, 30] },
      GOLD: { minOrder: 500000, discounts: [15, 20, 25, 30, 35] },
      PLATINUM: { minOrder: 1000000, discounts: [20, 25, 30, 35, 40] },
      DIAMOND: { minOrder: 2000000, discounts: [25, 30, 35, 40, 50] },
    };

    const rules = config[tierCode];
    if (!rules) return;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Valid for 30 days

    for (const discount of rules.discounts) {
      // Normalize user name to ASCII alphanumeric slug
      const userSlug = (user.name || 'USER')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 6);
      
      const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
      const code = `${tierCode}${discount}-${userSlug}-${randomStr}`;

      const coupon = this.couponRepository.create({
        code,
        name: `Voucher Hạng ${tier.name} ${discount}%`,
        description: `Ưu đãi thăng hạng ${tier.name}: Giảm ${discount}% cho đơn hàng từ ${rules.minOrder.toLocaleString('vi-VN')}đ`,
        discountType: 'PERCENT',
        discountValue: discount,
        minOrderAmount: rules.minOrder,
        startDate: new Date(),
        endDate: expiresAt,
        usageLimit: 1,
        usedCount: 0,
        usageLimitPerUser: 1,
        status: 'ACTIVE',
      });

      const savedCoupon = await this.couponRepository.save(coupon);

      const userVoucher = this.userVoucherRepository.create({
        user,
        coupon: savedCoupon,
        isUsed: false,
        expiresAt,
        source: 'TIER_REWARD',
      });

      await this.userVoucherRepository.save(userVoucher);
    }

    this.logger.log(`Generated 5 thăng hạng vouchers for User ${user.id} (${tierCode})`);
  }

  /**
   * Process pending cashback when an order is completed (7-day holding period)
   */
  async processOrderCashback(order: Order): Promise<CashbackTransaction | null> {
    if (!order.userId || order.status !== 'COMPLETED') return null;

    const user = await this.userRepository.findOne({
      where: { id: order.userId },
      relations: ['memberType'],
    });

    if (!user || !user.memberType) return null;

    const cashbackRate = Number(user.memberType.cashbackRate || 0);
    if (cashbackRate <= 0) return null;

    const orderTotal = Number(order.totalAmount || 0);
    const cashbackAmount = Number(((orderTotal * cashbackRate) / 100).toFixed(2));

    if (cashbackAmount <= 0) return null;

    // Check if transaction already exists for this order
    const existing = await this.cashbackRepository.findOne({
      where: { order: { id: order.id }, type: 'EARNED' },
    });

    if (existing) return existing;

    // Instant unlock (no delay)
    const availableAt = new Date();

    const transaction = this.cashbackRepository.create({
      user,
      order,
      amount: cashbackAmount,
      type: 'EARNED',
      status: 'AVAILABLE',
      availableAt,
      note: `Tích lũy hoàn tiền ${cashbackRate}% cho đơn hàng #${order.id.substring(0, 8)}`,
    });

    const saved = await this.cashbackRepository.save(transaction);

    // Update user cashback balance immediately
    user.cashbackBalance = Number(user.cashbackBalance || 0) + cashbackAmount;
    await this.userRepository.save(user);

    this.logger.log(
      `Logged instant cashback ${cashbackAmount}đ for User ${user.id} on Order ${order.id}`,
    );

    return saved;
  }

  /**
   * Revokes earned cashback if order is cancelled or refunded
   */
  async revokeOrderCashback(orderId: string): Promise<void> {
    const transactions = await this.cashbackRepository.find({
      where: { order: { id: orderId }, type: 'EARNED' },
      relations: ['user'],
    });

    for (const tx of transactions) {
      if (tx.status === 'CANCELLED') continue;

      if (tx.status === 'AVAILABLE' && tx.user) {
        const currentBal = Number(tx.user.cashbackBalance || 0);
        const amountToDeduct = Number(tx.amount || 0);
        tx.user.cashbackBalance = Math.max(0, currentBal - amountToDeduct);
        await this.userRepository.save(tx.user);
      }

      tx.status = 'CANCELLED';
      tx.note = `${tx.note || ''} (Đã hủy do đơn hàng bị hủy/hoàn tiền)`;
      await this.cashbackRepository.save(tx);

      this.logger.log(`Revoked earned cashback for order ${orderId}, tx ${tx.id}`);
    }
  }

  /**
   * Spends cashback balance at checkout
   */
  async spendCashback(userId: string, amount: number, orderId: string): Promise<CashbackTransaction> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const currentBalance = Number(user.cashbackBalance || 0);
    if (currentBalance < amount) {
      throw new BadRequestException(
        `Số dư hoàn tiền không đủ (Hiện có: ${currentBalance.toLocaleString('vi-VN')}đ, Cần: ${amount.toLocaleString('vi-VN')}đ)`,
      );
    }

    user.cashbackBalance = Math.max(0, currentBalance - amount);
    await this.userRepository.save(user);

    const transaction = this.cashbackRepository.create({
      user,
      order: { id: orderId } as Order,
      amount: amount,
      type: 'SPENT',
      status: 'AVAILABLE',
      availableAt: new Date(),
      note: `Sử dụng ${amount.toLocaleString('vi-VN')}đ hoàn tiền cho đơn hàng #${orderId.substring(0, 8)}`,
    });

    const saved = await this.cashbackRepository.save(transaction);
    this.logger.log(`User ${userId} spent ${amount}đ cashback on order ${orderId}`);
    return saved;
  }

  /**
   * Refunds spent cashback if order is cancelled or refunded
   */
  async refundSpentCashback(userId: string, orderId: string): Promise<void> {
    const transactions = await this.cashbackRepository.find({
      where: { order: { id: orderId }, type: 'SPENT' },
      relations: ['user'],
    });

    for (const tx of transactions) {
      if (tx.status === 'CANCELLED') continue;

      if (tx.user) {
        tx.user.cashbackBalance = Number(tx.user.cashbackBalance || 0) + Number(tx.amount || 0);
        await this.userRepository.save(tx.user);
      }

      tx.status = 'CANCELLED';
      tx.note = `${tx.note || ''} (Đã hoàn lại tiền do đơn hàng bị hủy)`;
      await this.cashbackRepository.save(tx);

      this.logger.log(`Refunded spent cashback ${tx.amount}đ for user ${userId} on cancelled order ${orderId}`);
    }
  }


  /**
   * Cron / Scheduled job to unlock pending cashback entries past 7-day holding period
   */
  async unlockPendingCashbacks(): Promise<number> {
    const now = new Date();
    const pendingTransactions = await this.cashbackRepository.find({
      where: {
        status: 'PENDING',
        availableAt: LessThanOrEqual(now),
      },
      relations: ['user'],
    });

    let unlockedCount = 0;

    for (const tx of pendingTransactions) {
      if (!tx.user) continue;

      tx.status = 'AVAILABLE';
      await this.cashbackRepository.save(tx);

      // Add to user balance
      tx.user.cashbackBalance =
        Number(tx.user.cashbackBalance || 0) + Number(tx.amount || 0);
      await this.userRepository.save(tx.user);

      unlockedCount++;
    }

    if (unlockedCount > 0) {
      this.logger.log(`Unlocked ${unlockedCount} pending cashback transactions.`);
    }

    return unlockedCount;
  }

  /**
   * Gets detailed membership information for user profile UI
   */
  async getUserMembershipDashboard(userId: string) {
    const user = await this.recalculateUserTier(userId);

    const allTiers = await this.memberTypeRepository.find({
      order: { rankLevel: 'ASC' },
    });

    const currentTier = user.memberType || allTiers[0];
    const nextTier = allTiers.find((t) => t.rankLevel > currentTier.rankLevel);

    let spentProgress = 100;
    let ordersProgress = 100;
    let overallProgress = 100;

    if (nextTier) {
      const minSpent = Number(nextTier.minSpent || 0);
      const minOrders = Number(nextTier.minOrders || 0);

      spentProgress = Math.min(100, Math.round((user.totalSpent / (minSpent || 1)) * 100));
      ordersProgress = Math.min(
        100,
        Math.round((user.completedOrdersCount / (minOrders || 1)) * 100),
      );

      // Combined minimum requirement progress
      overallProgress = Math.min(spentProgress, ordersProgress);
    }

    const history = await this.historyRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    const cashbackHistory = await this.cashbackRepository.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        totalSpent: user.totalSpent,
        completedOrdersCount: user.completedOrdersCount,
        cashbackBalance: user.cashbackBalance,
        tierUpdatedAt: user.tierUpdatedAt,
      },
      currentTier,
      nextTier: nextTier || null,
      progress: {
        spentProgress,
        ordersProgress,
        overallProgress,
        remainingSpent: nextTier
          ? Math.max(0, Number(nextTier.minSpent) - user.totalSpent)
          : 0,
        remainingOrders: nextTier
          ? Math.max(0, Number(nextTier.minOrders) - user.completedOrdersCount)
          : 0,
      },
      allTiers,
      history,
      cashbackHistory,
    };
  }

  /**
   * Retrieves all vouchers belonging to the user
   */
  async getUserVouchers(userId: string): Promise<UserVoucher[]> {
    return this.userVoucherRepository.find({
      where: { user: { id: userId } },
      relations: ['coupon'],
      order: { createdAt: 'DESC' },
    });
  }
}
