import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../base.entity';

@Entity('coupons')
export class Coupon extends BaseEntity {
  @Column({ unique: true })
  code: string; // Mã giảm giá (ví dụ: SALE2024, WELCOME10)

  @Column()
  name: string; // Tên mã giảm giá

  @Column({ type: 'text', nullable: true })
  description?: string; // Mô tả

  @Column({ type: 'enum', enum: ['PERCENT', 'AMOUNT'], default: 'PERCENT' })
  discountType: 'PERCENT' | 'AMOUNT'; // Loại giảm giá: phần trăm hoặc số tiền cố định

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  discountValue: number; // Giá trị giảm giá (phần trăm hoặc số tiền)

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  minOrderAmount?: number; // Đơn hàng tối thiểu để áp dụng

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  maxDiscountAmount?: number; // Giảm giá tối đa (cho loại PERCENT)

  @Column({ type: 'datetime', nullable: true })
  startDate?: Date; // Ngày bắt đầu

  @Column({ type: 'datetime', nullable: true })
  endDate?: Date; // Ngày kết thúc

  @Column({ type: 'int', default: 0 })
  usageLimit?: number; // Giới hạn số lần sử dụng (0 = không giới hạn)

  @Column({ type: 'int', default: 0 })
  usedCount: number; // Số lần đã sử dụng

  @Column({ type: 'int', default: 1 })
  usageLimitPerUser?: number; // Giới hạn số lần sử dụng mỗi user (1 = mỗi user chỉ dùng 1 lần)

  @Column({ default: 'ACTIVE' })
  status: string; // ACTIVE, INACTIVE, EXPIRED

  @Column({ type: 'text', nullable: true })
  applicableCategories?: string; // JSON array of category IDs (null = tất cả)

  @Column({ type: 'text', nullable: true })
  applicableProducts?: string; // JSON array of product IDs (null = tất cả)
}
