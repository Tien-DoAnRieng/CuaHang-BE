import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../shared/schemas/entities/order.entity';
import { User } from '../../shared/schemas/entities/user.entity';
import { Product } from '../../shared/schemas/entities/product.entity';
import { Category } from '../../shared/schemas/entities/category.entity';
import { OrderItem } from '../../shared/schemas/entities/order-item.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    @InjectRepository(Category) private categoryRepo: Repository<Category>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
  ) {}

  // 🧮 1. Tổng quan
  async getOverview() {
  const currentMonth = new Date().getMonth() + 1;
  const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;

  const currentRevenue = await this.getMonthlyRevenueValue(currentMonth);
  const lastRevenue = await this.getMonthlyRevenueValue(lastMonth);
  const totalOrders = await this.orderRepo.count();
  const totalCustomers = await this.userRepo.count();

  const revenueGrowth = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;

  return {
    totalRevenue: currentRevenue,
    revenueGrowth,
    totalOrders,
    ordersGrowth: revenueGrowth,
    totalCustomers,
    customersGrowth: 0, // nếu chưa tính khách mới
    totalGrowth: revenueGrowth,
  };
}


  private async getMonthlyRevenueValue(month: number): Promise<number> {
    const year = new Date().getFullYear();
    const result = await this.orderRepo
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('MONTH(order.createdAt) = :month', { month })
      .andWhere('YEAR(order.createdAt) = :year', { year })
      .getRawOne();

    return Number(result?.total || 0);
  }

  // 📈 2. Doanh thu theo tháng
async getMonthlyRevenue() {
  const year = new Date().getFullYear();

  const result = await this.orderRepo
    .createQueryBuilder('order')
    .select('MONTH(order.createdAt)', 'month')
    .addSelect('SUM(order.totalAmount)', 'actual')
    .where('YEAR(order.createdAt) = :year', { year })
    .groupBy('MONTH(order.createdAt)')
    .orderBy('month', 'ASC')
    .getRawMany();

  // tạo đủ 12 tháng, nếu tháng nào chưa có -> gán 0
  const data: { month: number; actual: number; target: number }[] = [];
  for (let i = 1; i <= 12; i++) {
    const found = result.find(r => Number(r.month) === i);
    const actual = found ? Number(found.actual) : 0;
    const target = 140000000 / 12; // ví dụ mục tiêu chia đều
    data.push({ month: i, actual, target });
  }
  return data;
}


  // 📊 3. Phân bổ doanh thu theo danh mục
  async getRevenueByCategory() {
    const result = await this.orderItemRepo
      .createQueryBuilder('item')
      .leftJoin('item.variant', 'variant')
      .leftJoin('variant.product', 'product')
      .leftJoin('product.category', 'category')
      .select('category.name', 'category')
      .addSelect('SUM(item.priceAtTime * item.quantity)', 'amount')
      .groupBy('category.name')
      .getRawMany();

    const total = result.reduce((acc, r) => acc + Number(r.amount), 0);
    return result.map((r) => ({
      category: r.category,
      amount: Number(r.amount),
      percentage: total ? (Number(r.amount) / total) * 100 : 0,
    }));
  }

  // 👥 4. Thống kê khách hàng
  async getCustomerStats() {
  const year = new Date().getFullYear();

  const result = await this.userRepo
    .createQueryBuilder('user')
    .select('MONTH(user.createdAt)', 'month')
    .addSelect('COUNT(user.id)', 'total')
    .where('YEAR(user.createdAt) = :year', { year })
    .groupBy('MONTH(user.createdAt)')
    .orderBy('month', 'ASC')
    .getRawMany();

  const data: { month: string; total: number; newCustomers: number; returningCustomers: number }[] = [];
  for (let i = 1; i <= 12; i++) {
    const found = result.find(r => Number(r.month) === i);
    const total = found ? Number(found.total) : 0;
    data.push({
      month: `Tháng ${i}`,
      total,
      newCustomers: total, // nếu bạn chưa tách logic khách quay lại
      returningCustomers: 0,
    });
  }

  return data;
}


  // 📆 5. Tăng trưởng doanh thu theo tuần
  async getWeeklyGrowth() {
  const now = new Date();
  const past = new Date();
  past.setDate(now.getDate() - 28); // 4 tuần trước

  const result = await this.orderRepo
    .createQueryBuilder('order')
    .select("YEARWEEK(order.createdAt, 1)", "yearWeek")
    .addSelect("SUM(order.totalAmount)", "revenue")
    .where("order.createdAt BETWEEN :past AND :now", { past, now })
    .groupBy("YEARWEEK(order.createdAt, 1)")
    .orderBy("yearWeek", "ASC")
    .getRawMany();

  const data = result.map((r, i) => {
    const revenue = Number(r.revenue);
    const prev = i > 0 ? Number(result[i - 1].revenue) : 0;
    const growthRate = prev > 0 ? ((revenue - prev) / prev) * 100 : 0;
    return {
      week: i + 1,
      revenue,
      growthRate: +growthRate.toFixed(2),
    };
  });

  return data;
}


  // 🧾 6. Đơn hàng gần đây
  async getRecentOrders() {
    const orders = await this.orderRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return orders.map((o) => ({
      orderId: o.id,
      customerName: o.user?.name || 'Khách hàng',
      totalAmount: Number(o.totalAmount),
      status: o.status,
    }));
  }

  // 🛍️ 7. Sản phẩm bán chạy
  async getTopProducts() {
    const result = await this.orderItemRepo
      .createQueryBuilder('item')
      .leftJoin('item.variant', 'variant')
      .leftJoin('variant.product', 'product')
      .select('product.name', 'productName')
      .addSelect('SUM(item.quantity)', 'sold')
      .addSelect('AVG(item.priceAtTime)', 'price')
      .groupBy('product.name')
      .orderBy('SUM(item.quantity)', 'DESC')
      .limit(5)
      .getRawMany();

    return result.map((r) => ({
      productName: r.productName,
      sold: Number(r.sold),
      price: Number(r.price),
    }));
  }
}
