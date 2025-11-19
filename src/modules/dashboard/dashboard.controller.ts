import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import type { Response } from 'express';
import {
  OverviewDto,
  MonthlyRevenueDto,
  CategoryRevenueDto,
  CustomerStatsDto,
  WeeklyGrowthDto,
} from './dto/dashboard.dto';
import { parseISO } from 'date-fns';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Tổng quan doanh thu, đơn hàng, khách hàng',
  })
  @ApiResponse({ status: 200, type: OverviewDto })
  getOverview(): Promise<OverviewDto> {
    return this.dashboardService.getOverview();
  }

@Get('monthly-revenue')
@ApiOperation({ summary: 'Doanh thu theo tháng' })
@ApiResponse({ status: 200, type: [MonthlyRevenueDto] })
async getMonthlyRevenue(): Promise<MonthlyRevenueDto[]> {
  return this.dashboardService.getMonthlyRevenue();
}


  @Get('category-revenue')
  @ApiOperation({ summary: 'Doanh thu theo danh mục sản phẩm' })
  @ApiResponse({ status: 200, type: [CategoryRevenueDto] })
  getRevenueByCategory() {
    return this.dashboardService.getRevenueByCategory();
  }

  @Get('customer-stats')
  @ApiOperation({ summary: 'Thống kê khách hàng theo tháng' })
  @ApiResponse({ status: 200, type: [CustomerStatsDto] })
  getCustomerStats() {
    return this.dashboardService.getCustomerStats();
  }

  @Get('weekly-growth')
  @ApiOperation({ summary: 'Tăng trưởng doanh thu theo tuần' })
  @ApiResponse({ status: 200, type: [WeeklyGrowthDto] })
  getWeeklyGrowth() {
    return this.dashboardService.getWeeklyGrowth();
  }

  @Get('recent-orders')
  @ApiOperation({ summary: '5 đơn hàng gần đây' })
  getRecentOrders() {
    return this.dashboardService.getRecentOrders();
  }

  // Helper: parse query param number / number[]
  private parseQueryNumbers(query?: string | string[]): number[] | undefined {
    if (!query) return undefined;
    if (Array.isArray(query)) return query.map(Number);
    return [Number(query)];
  }

  @Get('export-revenue')
  @ApiOperation({ summary: 'Xuất Excel doanh thu theo loại' })
  @ApiQuery({ name: 'type', enum: ['month', 'week', 'year'], required: true })
  @ApiQuery({ name: 'month', required: false, isArray: true })
  @ApiQuery({ name: 'week', required: false, isArray: true })
  @ApiQuery({ name: 'year', required: false, isArray: true })
  async exportRevenue(
    @Res() res: Response,
    @Query('type') type: 'month' | 'year' | 'week',
    @Query('month') month?: string | string[],
    @Query('week') week?: string | string[],
    @Query('year') year?: string | string[],
  ) {
    const monthsArr = this.parseQueryNumbers(month);
    const weeksArr = this.parseQueryNumbers(week);
    const yearsArr = this.parseQueryNumbers(year);

    const buffer = await this.dashboardService.exportRevenueExcel(type, monthsArr, yearsArr, weeksArr);

    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=DoanhThu-${type}.xlsx`,
    });
    res.send(buffer);
  }

  @Get('export-orders')
  @ApiOperation({ summary: 'Xuất Excel danh sách đơn hàng' })
  @ApiQuery({ name: 'type', enum: ['day', 'week', 'month'], required: true })
  @ApiQuery({ name: 'date', required: true })
  async exportOrdersExcel(
    @Res() res: Response,
    @Query('type') type: 'day' | 'week' | 'month',
    @Query('date') date: string,
  ) {
    const buffer = await this.dashboardService.exportOrdersExcel(type, date);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename=DanhSachDonHang-${type}.xlsx`,
    });
    res.send(buffer);
  }
}
