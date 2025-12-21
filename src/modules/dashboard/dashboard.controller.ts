import { Controller, Get, Query, Res, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleEnum } from '../../common/enums/role.enum';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
@ApiBearerAuth('access-token')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Tổng quan doanh thu, đơn hàng, khách hàng (Cả Admin và Seller đều thấy tất cả)',
  })
  @ApiResponse({ status: 200, type: OverviewDto })
  getOverview(@Req() req: any): Promise<OverviewDto> {
    const user = req.user;
    const userRoles = Array.isArray(user?.roles)
      ? user.roles.map((r: any) => (typeof r === 'string' ? r : r.name))
      : user?.role
      ? [user.role.name || user.role]
      : [];
    // Cả Admin và Seller đều thấy tất cả thống kê (không filter theo sellerId)
    const sellerId = undefined;
    
    // Debug logging
    console.log('[DashboardController.getOverview] Debug:', {
      userId: user?.id,
      userRoles,
      isSeller: userRoles.includes(RoleEnum.SELLER),
      isAdmin: userRoles.includes(RoleEnum.ADMIN),
      sellerId
    });
    
    return this.dashboardService.getOverview(sellerId);
  }



  @Get('category-revenue')
  @ApiOperation({ summary: 'Doanh thu theo danh mục sản phẩm (Cả Admin và Seller đều thấy tất cả)' })
  @ApiResponse({ status: 200, type: [CategoryRevenueDto] })
  getRevenueByCategory(@Req() req: any) {
    const user = req.user;
    const userRoles = Array.isArray(user?.roles)
      ? user.roles.map((r: any) => (typeof r === 'string' ? r : r.name))
      : user?.role
      ? [user.role.name || user.role]
      : [];
    // Cả Admin và Seller đều thấy tất cả thống kê (không filter theo sellerId)
    const sellerId = undefined;
    return this.dashboardService.getRevenueByCategory(sellerId);
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
  @ApiOperation({ summary: '5 đơn hàng gần đây (Cả Admin và Seller đều thấy tất cả)' })
  getRecentOrders(@Req() req: any) {
    const user = req.user;
    const userRoles = Array.isArray(user?.roles)
      ? user.roles.map((r: any) => (typeof r === 'string' ? r : r.name))
      : user?.role
      ? [user.role.name || user.role]
      : [];
    // Cả Admin và Seller đều thấy tất cả thống kê (không filter theo sellerId)
    const sellerId = undefined;
    return this.dashboardService.getRecentOrders(sellerId);
  }

  private parseQueryNumbers(query?: string | string[]): number[] | undefined {
    if (!query) return undefined;
    if (Array.isArray(query)) return query.map(Number);
    return [Number(query)];
  }

  @Get('export-revenue')
  @ApiOperation({ summary: 'Xuất Excel doanh thu theo loại' })
  @ApiQuery({ name: 'type', enum: ['day', 'month', 'week', 'year'], required: true })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'month', required: false, isArray: true })
  @ApiQuery({ name: 'week', required: false, isArray: true })
  @ApiQuery({ name: 'year', required: false, isArray: true })
  async exportRevenue(
    @Res() res: Response,
    @Query('type') type: 'day' | 'month' | 'year' | 'week',
    @Query('date') date?: string,
    @Query('month') month?: string | string[],
    @Query('week') week?: string | string[],
    @Query('year') year?: string | string[],
  ) {
    const monthsArr = this.parseQueryNumbers(month);
    const weeksArr = this.parseQueryNumbers(week);
    const yearsArr = this.parseQueryNumbers(year);

    const buffer = await this.dashboardService.exportRevenueExcel(type, monthsArr, yearsArr, weeksArr, date);

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
@Get('daily-revenue')
@ApiOperation({ summary: 'Doanh thu theo ngày (Cả Admin và Seller đều thấy tất cả)' })
async getDailyRevenue(@Req() req: any, @Query('year') year?: string, @Query('month') month?: string) {
  const y = year ? Number(year) : new Date().getFullYear();
  const m = month ? Number(month) : new Date().getMonth() + 1;
  const user = req.user;
  const userRoles = Array.isArray(user?.roles)
    ? user.roles.map((r: any) => (typeof r === 'string' ? r : r.name))
    : user?.role
    ? [user.role.name || user.role]
    : [];
  const sellerId = userRoles.includes(RoleEnum.SELLER) && !userRoles.includes(RoleEnum.ADMIN) ? user.id : undefined;
  return this.dashboardService.getDailyRevenue(y, m, sellerId);
}

@Get('yearly-revenue')
@ApiOperation({ summary: 'Doanh thu theo năm (Cả Admin và Seller đều thấy tất cả)' })
async getYearlyRevenue(@Req() req: any) {
  const user = req.user;
  const userRoles = Array.isArray(user?.roles)
    ? user.roles.map((r: any) => (typeof r === 'string' ? r : r.name))
    : user?.role
    ? [user.role.name || user.role]
    : [];
  const sellerId = userRoles.includes(RoleEnum.SELLER) && !userRoles.includes(RoleEnum.ADMIN) ? user.id : undefined;
  return this.dashboardService.getYearlyRevenue(sellerId);
}

@Get('monthly-revenue')
@ApiOperation({ summary: 'Doanh thu theo tháng (Cả Admin và Seller đều thấy tất cả)' })
@ApiQuery({ name: 'year', required: false })
async getMonthlyRevenueFiltered(@Req() req: any, @Query('year') year?: string) {
  const y = year ? Number(year) : undefined;
  const user = req.user;
  const userRoles = Array.isArray(user?.roles)
    ? user.roles.map((r: any) => (typeof r === 'string' ? r : r.name))
    : user?.role
    ? [user.role.name || user.role]
    : [];
  const sellerId = userRoles.includes(RoleEnum.SELLER) && !userRoles.includes(RoleEnum.ADMIN) ? user.id : undefined;
  return this.dashboardService.getMonthlyRevenue(y, sellerId);
}

@Get('revenue-by-payment-method')
@ApiOperation({ summary: 'Doanh thu theo phương thức thanh toán (Cả Admin và Seller đều thấy tất cả)' })
async getRevenueByPaymentMethod(@Req() req: any) {
  const user = req.user;
  const userRoles = Array.isArray(user?.roles)
    ? user.roles.map((r: any) => (typeof r === 'string' ? r : r.name))
    : user?.role
    ? [user.role.name || user.role]
    : [];
  const sellerId = userRoles.includes(RoleEnum.SELLER) && !userRoles.includes(RoleEnum.ADMIN) ? user.id : undefined;
  return this.dashboardService.getRevenueByPaymentMethod(sellerId);
}

@Get('today-payment-distribution')
@ApiOperation({ summary: 'Phân bổ thanh toán hôm nay (Cả Admin và Seller đều thấy tất cả)' })
async getTodayPaymentDistribution(@Req() req: any) {
  const user = req.user;
  const userRoles = Array.isArray(user?.roles)
    ? user.roles.map((r: any) => (typeof r === 'string' ? r : r.name))
    : user?.role
    ? [user.role.name || user.role]
    : [];
  const sellerId = userRoles.includes(RoleEnum.SELLER) && !userRoles.includes(RoleEnum.ADMIN) ? user.id : undefined;
  return this.dashboardService.getTodayPaymentDistribution(sellerId);
}

@Get('top-products')
@ApiOperation({ summary: 'Sản phẩm bán chạy (Cả Admin và Seller đều thấy tất cả)' })
@ApiQuery({ name: 'limit', required: false, type: Number })
async getTopProducts(@Req() req: any, @Query('limit') limit?: string) {
  const limitNum = limit ? Number(limit) : 10;
  const user = req.user;
  const userRoles = Array.isArray(user?.roles)
    ? user.roles.map((r: any) => (typeof r === 'string' ? r : r.name))
    : user?.role
    ? [user.role.name || user.role]
    : [];
  const sellerId = userRoles.includes(RoleEnum.SELLER) && !userRoles.includes(RoleEnum.ADMIN) ? user.id : undefined;
  return this.dashboardService.getTopProducts(limitNum, sellerId);
}

}
