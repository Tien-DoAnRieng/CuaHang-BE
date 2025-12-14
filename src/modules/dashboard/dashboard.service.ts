import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from '../../shared/schemas/entities/order.entity';
import { User } from '../../shared/schemas/entities/user.entity';
import { OrderItem } from '../../shared/schemas/entities/order-item.entity';
import { Payment } from '../../shared/schemas/entities/payment.entity';
import { Product } from '../../shared/schemas/entities/product.entity';
import * as ExcelJS from 'exceljs';
import { parseISO, startOfWeek, endOfWeek } from 'date-fns';
import {
  OverviewDto,
  MonthlyRevenueDto,
  CategoryRevenueDto,
  CustomerStatsDto,
  WeeklyGrowthDto,
} from './dto/dashboard.dto';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Order) private orderRepo: Repository<Order>,
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(OrderItem) private orderItemRepo: Repository<OrderItem>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
  ) {}
  async getOverview(): Promise<OverviewDto> {
    const currentMonth = new Date().getMonth() + 1;
    const lastMonth = currentMonth === 1 ? 12 : currentMonth - 1;

    const currentRevenue = await this.getMonthlyRevenueValue(currentMonth);
    const lastRevenue = await this.getMonthlyRevenueValue(lastMonth);

    const totalOrders = await this.orderRepo.count();
    const totalCustomers = await this.userRepo.count();

    const revenueGrowth =
      lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;

    return {
      totalRevenue: currentRevenue,
      revenueGrowth,
      totalOrders,
      ordersGrowth: revenueGrowth,
      totalCustomers,
      customersGrowth: 0,
      totalGrowth: revenueGrowth,
    };
  }

  private async getMonthlyRevenueValue(month: number): Promise<number> {
    const year = new Date().getFullYear();
    const result = await this.orderRepo
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('EXTRACT(MONTH FROM order.createdAt) = :month', { month })
      .andWhere('EXTRACT(YEAR FROM order.createdAt) = :year', { year })
      .getRawOne();
    return Number(result?.total || 0);
  }
  async getRevenueByCategory(): Promise<CategoryRevenueDto[]> {
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
  async getCustomerStats(): Promise<CustomerStatsDto[]> {
    const year = new Date().getFullYear();
    const result = await this.userRepo
      .createQueryBuilder('user')
      .select('EXTRACT(MONTH FROM user.createdAt)', 'month')
      .addSelect('COUNT(user.id)', 'total')
      .where('EXTRACT(YEAR FROM user.createdAt) = :year', { year })
      .groupBy('month')
      .orderBy('month', 'ASC')
      .getRawMany();

    const data: CustomerStatsDto[] = [];
    for (let i = 1; i <= 12; i++) {
      const found = result.find((r) => Number(r.month) === i);
      const total = found ? Number(found.total) : 0;
      data.push({
        month: `Tháng ${i}`,
        total,
        newCustomers: total,
        returningCustomers: 0,
      });
    }
    return data;
  }
  async getWeeklyGrowth(): Promise<WeeklyGrowthDto[]> {
    const now = new Date();
    const past = new Date();
    past.setDate(now.getDate() - 28);

    const result = await this.orderRepo
      .createQueryBuilder('order')
      .select('EXTRACT(WEEK FROM order.createdAt)', 'week')
      .addSelect('SUM(order.totalAmount)', 'revenue')
      .where('order.createdAt BETWEEN :past AND :now', { past, now })
      .groupBy('week')
      .orderBy('week', 'ASC')
      .getRawMany();

    return result.map((r, i) => {
      const revenue = Number(r.revenue);
      const prev = i > 0 ? Number(result[i - 1].revenue) : 0;
      return {
        week: Number(r.week),
        revenue,
        growthRate: prev > 0 ? +(((revenue - prev) / prev) * 100).toFixed(2) : 0,
      };
    });
  }
  async getRecentOrders() {
    return this.orderRepo
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .orderBy('order.createdAt', 'DESC')
      .limit(5)
      .getMany();
  }
async exportRevenueExcel(
  type: 'day' | 'month' | 'year' | 'week',
  months?: number[],
  years?: number[],
  weeks?: number[],
  date?: string,
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Revenue');

  sheet.addRow(['Date/Month/Week/Year', 'Revenue', 'Target']);

  if (type === 'day' && date) {
    const targetDate = parseISO(date);
    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);
    
    const result = await this.orderRepo
      .createQueryBuilder('order')
      .select('SUM(order.totalAmount)', 'total')
      .where('order.createdAt BETWEEN :start AND :end', {
        start: dayStart,
        end: dayEnd,
      })
      .getRawOne();
    
    sheet.addRow([date, Number(result?.total || 0), 0]);
  }

  if (type === 'month') {
    const data = await this.getMonthlyRevenue();
    data.forEach(d => {
      if (!months || months.includes(d.month)) {
        sheet.addRow([d.month, d.actual, d.target]);
      }
    });
  }

  if (type === 'year') {
    const currentYear = new Date().getFullYear();
    const yearsArr = years && years.length ? years : [currentYear];
    for (const year of yearsArr) {
      const result = await this.orderRepo
        .createQueryBuilder('order')
        .select('SUM(order.totalAmount)', 'total')
        .where('EXTRACT(YEAR FROM order.createdAt) = :year', { year })
        .getRawOne();
      sheet.addRow([year, Number(result?.total || 0), 0]);
    }
  }

  if (type === 'week') {
    const data = await this.getWeeklyGrowth();
    data.forEach(d => {
      if (!weeks || weeks.includes(d.week)) {
        sheet.addRow([`Tuần ${d.week}`, d.revenue, 0]);
      }
    });
  }
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
async exportOrdersExcel(type: 'day' | 'week' | 'month', date: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Orders');
  sheet.addRow(['Order ID', 'Customer', 'Amount', 'Created At']);

  const referenceDate = parseISO(date);
  let ordersQuery = this.orderRepo
    .createQueryBuilder('order')
    .leftJoinAndSelect('order.user', 'user');

  if (type === 'day') {
    const dayStart = new Date(referenceDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(referenceDate);
    dayEnd.setHours(23, 59, 59, 999);
    ordersQuery = ordersQuery.where('order.createdAt BETWEEN :start AND :end', {
      start: dayStart,
      end: dayEnd,
    });
  } else if (type === 'week') {
    const start = startOfWeek(referenceDate, { weekStartsOn: 1 });
    const end = endOfWeek(referenceDate, { weekStartsOn: 1 });
    ordersQuery = ordersQuery.where('order.createdAt BETWEEN :start AND :end', {
      start,
      end,
    });
  } else if (type === 'month') {
    const month = referenceDate.getMonth() + 1;
    const year = referenceDate.getFullYear();
    ordersQuery = ordersQuery
      .where('EXTRACT(MONTH FROM order.createdAt) = :month', { month })
      .andWhere('EXTRACT(YEAR FROM order.createdAt) = :year', { year });
  }

  const orders = await ordersQuery.getMany();
  orders.forEach(o => {
    sheet.addRow([o.id, o.user.name, o.totalAmount, o.createdAt]);
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}
async getDailyRevenue(year: number, month: number): Promise<MonthlyRevenueDto[]> {
  const result = await this.orderRepo
    .createQueryBuilder('order')
    .select('EXTRACT(DAY FROM order.createdAt)', 'day')
    .addSelect('SUM(order.totalAmount)', 'total')
    .where('EXTRACT(YEAR FROM order.createdAt) = :year', { year })
    .andWhere('EXTRACT(MONTH FROM order.createdAt) = :month', { month })
    .groupBy('day')
    .orderBy('day', 'ASC')
    .getRawMany();

  const daysInMonth = new Date(year, month, 0).getDate();
  const data: MonthlyRevenueDto[] = [];
  for (let i = 1; i <= daysInMonth; i++) {
    const found = result.find((r) => Number(r.day) === i);
    const actual = found ? Number(found.total) : 0;
    data.push({ month: i, actual, target: 0 }); // target có thể tuỳ chỉnh
  }
  return data;
}
async getYearlyRevenue(): Promise<MonthlyRevenueDto[]> {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - 4; // ví dụ 5 năm gần đây

  const result = await this.orderRepo
    .createQueryBuilder('order')
    .select('EXTRACT(YEAR FROM order.createdAt)', 'year')
    .addSelect('SUM(order.totalAmount)', 'total')
    .where('EXTRACT(YEAR FROM order.createdAt) >= :startYear', { startYear })
    .groupBy('year')
    .orderBy('year', 'ASC')
    .getRawMany();

  const data: MonthlyRevenueDto[] = [];
  for (let y = startYear; y <= currentYear; y++) {
    const found = result.find((r) => Number(r.year) === y);
    const actual = found ? Number(found.total) : 0;
    data.push({ month: y, actual, target: 0 });
  }
  return data;
}
async getMonthlyRevenue(year?: number): Promise<MonthlyRevenueDto[]> {
  const y = year || new Date().getFullYear();
  const result = await this.orderRepo
    .createQueryBuilder('order')
    .select('EXTRACT(MONTH FROM order.createdAt)', 'month')
    .addSelect('SUM(order.totalAmount)', 'actual')
    .where('EXTRACT(YEAR FROM order.createdAt) = :year', { year: y })
    .groupBy('month')
    .orderBy('month', 'ASC')
    .getRawMany();

  const data: MonthlyRevenueDto[] = [];
  for (let i = 1; i <= 12; i++) {
    const found = result.find((r) => Number(r.month) === i);
    const actual = found ? Number(found.actual) : 0;
    data.push({ month: i, actual, target: 140_000_000 / 12 });
  }
  return data;
}

  // Doanh thu theo phương thức thanh toán
  async getRevenueByPaymentMethod(): Promise<{ method: string; amount: number; percentage: number }[]> {
    // Thử query từ payment trước
    let result = await this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoin('payment.order', 'order')
      .select('payment.paymentMethod', 'method')
      .addSelect('SUM(order.totalAmount)', 'amount')
      .where('payment.status = :status', { status: 'SUCCESS' })
      .groupBy('payment.paymentMethod')
      .getRawMany();

    // Nếu không có dữ liệu từ payment, lấy từ orders
    if (!result || result.length === 0) {
      result = await this.orderRepo
        .createQueryBuilder('order')
        .select('order.paymentMethod', 'method')
        .addSelect('SUM(order.totalAmount)', 'amount')
        .where('order.status IN (:...statuses)', { statuses: ['DELIVERED', 'COMPLETED', 'PAID', 'SHIPPED'] })
        .groupBy('order.paymentMethod')
        .getRawMany();
    }

    const total = result.reduce((acc, r) => acc + Number(r.amount || 0), 0);
    return result.map((r) => ({
      method: r.method || 'Không xác định',
      amount: Number(r.amount || 0),
      percentage: total > 0 ? (Number(r.amount || 0) / total) * 100 : 0,
    }));
  }

  // Phân bổ thanh toán hôm nay
  async getTodayPaymentDistribution(): Promise<{ method: string; amount: number; count: number }[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Thử query từ payment trước
    let result = await this.paymentRepo
      .createQueryBuilder('payment')
      .leftJoin('payment.order', 'order')
      .select('payment.paymentMethod', 'method')
      .addSelect('SUM(order.totalAmount)', 'amount')
      .addSelect('COUNT(payment.id)', 'count')
      .where('payment.paymentTime >= :start', { start: today })
      .andWhere('payment.paymentTime < :end', { end: tomorrow })
      .andWhere('payment.status = :status', { status: 'SUCCESS' })
      .groupBy('payment.paymentMethod')
      .getRawMany();

    // Nếu không có dữ liệu từ payment, lấy từ orders
    if (!result || result.length === 0) {
      result = await this.orderRepo
        .createQueryBuilder('order')
        .select('order.paymentMethod', 'method')
        .addSelect('SUM(order.totalAmount)', 'amount')
        .addSelect('COUNT(order.id)', 'count')
        .where('order.createdAt >= :start', { start: today })
        .andWhere('order.createdAt < :end', { end: tomorrow })
        .andWhere('order.status IN (:...statuses)', { statuses: ['DELIVERED', 'COMPLETED', 'PAID', 'SHIPPED'] })
        .groupBy('order.paymentMethod')
        .getRawMany();
    }

    return result.map((r) => ({
      method: r.method || 'Không xác định',
      amount: Number(r.amount || 0),
      count: Number(r.count || 0),
    }));
  }

  // Sản phẩm bán chạy
  async getTopProducts(limit: number = 10): Promise<{ id: string; name: string; sold: number; revenue: number }[]> {
    const result = await this.orderItemRepo
      .createQueryBuilder('item')
      .leftJoin('item.variant', 'variant')
      .leftJoin('variant.product', 'product')
      .leftJoin('item.order', 'order')
      .select('product.id', 'id')
      .addSelect('product.name', 'name')
      .addSelect('SUM(item.quantity)', 'sold')
      .addSelect('SUM(item.priceAtTime * item.quantity)', 'revenue')
      .where('order.status IN (:...statuses)', { statuses: ['DELIVERED', 'COMPLETED', 'PAID', 'SHIPPED'] })
      .groupBy('product.id')
      .addGroupBy('product.name')
      .orderBy('sold', 'DESC')
      .limit(limit)
      .getRawMany();

    return result.map((r) => ({
      id: r.id,
      name: r.name || 'Sản phẩm không tên',
      sold: Number(r.sold || 0),
      revenue: Number(r.revenue || 0),
    }));
  }
}
