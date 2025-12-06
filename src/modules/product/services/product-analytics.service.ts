import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderItem } from '../../../shared/schemas/entities/order-item.entity';
import { OrderStatus } from '../../../common/enums/order-status.enum';

@Injectable()
export class ProductAnalyticsService {
  constructor(
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
  ) {}
  async getTopSelling({ limit = 10, days, categoryId }: { limit?: number; days?: number; categoryId?: string }) {
    const statuses = [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED];

    const qb = this.orderItemRepository.createQueryBuilder('oi')
      .innerJoin('product_variants', 'pv', 'oi.variant_id = pv.id')
      .innerJoin('products', 'p', 'pv.product_id = p.id')
      .innerJoin('orders', 'o', 'oi.order_id = o.id')
      .where('o.status IN (:...statuses)', { statuses })
      .select('p.id', 'productId')
      .addSelect('p.name', 'name')
      .addSelect('p.price', 'price')
      .addSelect('p.brand', 'brand')
      .addSelect('SUM(oi.quantity)', 'sold')
      .groupBy('p.id')
      .orderBy('sold', 'DESC')
      .limit(limit);

    if (typeof days === 'number' && days > 0) {
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
      qb.andWhere('o.created_at >= :since', { since });
    }

    if (categoryId) {
      qb.andWhere('p.category_id = :cat', { cat: categoryId });
    }

    const rows = await qb.getRawMany();
    return rows.map(r => ({
      productId: r.productId,
      name: r.name,
      brand: r.brand,
      price: Number(r.price),
      sold: Number(r.sold),
    }));
  }
  async getTopSellingAdmin({ page = 1, limit = 20, from, to, categoryId }: { page?: number; limit?: number; from?: string; to?: string; categoryId?: string }) {
    const statuses = [OrderStatus.PAID, OrderStatus.SHIPPED, OrderStatus.DELIVERED, OrderStatus.COMPLETED];

    const offset = (page - 1) * limit;

    const qb = this.orderItemRepository.createQueryBuilder('oi')
      .innerJoin('product_variants', 'pv', 'oi.variant_id = pv.id')
      .innerJoin('products', 'p', 'pv.product_id = p.id')
      .leftJoin('product_images', 'pi', 'pi.product_id = p.id AND pi.is_main = 1')
      .innerJoin('orders', 'o', 'oi.order_id = o.id')
      .where('o.status IN (:...statuses)', { statuses })
      .select('p.id', 'productId')
      .addSelect('p.name', 'name')
      .addSelect('p.brand', 'brand')
      .addSelect('p.price', 'price')
        .addSelect("COALESCE(MAX(CASE WHEN pi.is_main = 1 THEN pi.image_url END), MIN(pi.image_url))", 'image')
      .addSelect('SUM(oi.quantity)', 'sold')
      .addSelect('SUM(oi.quantity * oi.price_at_time)', 'revenue')
      .groupBy('p.id')
      .orderBy('sold', 'DESC')
      .offset(offset)
      .limit(limit);

    if (from) {
      const f = new Date(from);
      if (!isNaN(f.getTime())) qb.andWhere('o.created_at >= :from', { from: f });
    }
    if (to) {
      const t = new Date(to);
      if (!isNaN(t.getTime())) qb.andWhere('o.created_at <= :to', { to: t });
    }
    if (categoryId) qb.andWhere('p.category_id = :cat', { cat: categoryId });

    const rows = await qb.getRawMany();
    const countQb = this.orderItemRepository.createQueryBuilder('oi')
      .innerJoin('product_variants', 'pv', 'oi.variant_id = pv.id')
      .innerJoin('products', 'p', 'pv.product_id = p.id')
      .innerJoin('orders', 'o', 'oi.order_id = o.id')
      .where('o.status IN (:...statuses)', { statuses });
    if (from) {
      const f = new Date(from);
      if (!isNaN(f.getTime())) countQb.andWhere('o.created_at >= :from', { from: f });
    }
    if (to) {
      const t = new Date(to);
      if (!isNaN(t.getTime())) countQb.andWhere('o.created_at <= :to', { to: t });
    }
    if (categoryId) countQb.andWhere('p.category_id = :cat', { cat: categoryId });

    const countRaw = await countQb.select('COUNT(DISTINCT p.id)', 'cnt').getRawOne();
    const total = countRaw ? Number(countRaw.cnt) : 0;

    const data = rows.map(r => ({
      productId: r.productId,
      name: r.name,
      brand: r.brand,
      price: Number(r.price),
      image: r.image || null,
      sold: Number(r.sold),
      revenue: Number(r.revenue),
    }));

    return { data, total, page, limit };
  }
}
