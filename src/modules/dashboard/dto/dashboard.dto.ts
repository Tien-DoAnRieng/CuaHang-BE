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

