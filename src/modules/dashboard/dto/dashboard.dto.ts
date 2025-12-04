import { ApiProperty } from '@nestjs/swagger';

export class OverviewDto {
  @ApiProperty() totalRevenue: number;
  @ApiProperty() revenueGrowth: number;
  @ApiProperty() totalOrders: number;
  @ApiProperty() ordersGrowth: number;
  @ApiProperty() totalCustomers: number;
  @ApiProperty() customersGrowth: number;
  @ApiProperty() totalGrowth: number;
}

export class MonthlyRevenueDto {
  @ApiProperty() month: number;
  @ApiProperty() actual: number;
  @ApiProperty() target: number;
}

export class CategoryRevenueDto {
  @ApiProperty() category: string;
  @ApiProperty() amount: number;
  @ApiProperty() percentage: number;
}

export class CustomerStatsDto {
  @ApiProperty() month: string;
  @ApiProperty() total: number;
  @ApiProperty() newCustomers: number;
  @ApiProperty() returningCustomers: number;
}
export class WeeklyGrowthDto {
  @ApiProperty() week: number;
  @ApiProperty() revenue: number;
  @ApiProperty() growthRate: number;
}
export interface MonthlyRevenue {
  month: number;
  total: number;
}

export interface CustomerStats {
  month: string;
  total: number;
  newCustomers: number;
  returningCustomers: number;
}

export interface WeeklyGrowth {
  week: number;
  revenue: number;
  growthRate: number;
}
export class DailyRevenueDto {
  @ApiProperty({ description: 'Ngày trong tháng' })
  day: number;

  @ApiProperty({ description: 'Doanh thu thực tế' })
  actual: number;

  @ApiProperty({ description: 'Mục tiêu (nếu có)', required: false })
  target: number;
}

// Doanh thu theo năm
export class YearlyRevenueDto {
  @ApiProperty({ description: 'Năm' })
  year: number;

  @ApiProperty({ description: 'Doanh thu thực tế' })
  actual: number;

  @ApiProperty({ description: 'Mục tiêu (nếu có)', required: false })
  target: number;
}