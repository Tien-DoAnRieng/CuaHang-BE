import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { MonthlyRevenueDto } from './dto/dashboard.dto';
@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Tổng quan doanh thu, đơn hàng, khách hàng' })
  @ApiResponse({ status: 200, description: 'Trả về số liệu tổng quan' })
  getOverview() {
    return this.dashboardService.getOverview();
  }

  @Get('monthly-revenue')
  @ApiOperation({ summary: 'Doanh thu theo tháng' })
  @ApiResponse({ status: 200, description: 'Trả về doanh thu từng tháng', type: [MonthlyRevenueDto] })
  getMonthlyRevenue() {
    return this.dashboardService.getMonthlyRevenue();
  }

  @Get('category-revenue')
  @ApiOperation({ summary: 'Phân bổ doanh thu theo danh mục sản phẩm' })
  @ApiResponse({ status: 200, description: 'Trả về doanh thu theo danh mục' })
  getRevenueByCategory() {
    return this.dashboardService.getRevenueByCategory();
  }

  @Get('customer-stats')
  @ApiOperation({ summary: 'Thống kê khách hàng theo tháng' })
  @ApiResponse({ status: 200, description: 'Trả về số lượng khách hàng mới / quay lại' })
  getCustomerStats() {
    return this.dashboardService.getCustomerStats();
  }

  @Get('weekly-growth')
  @ApiOperation({ summary: 'Tăng trưởng doanh thu theo tuần' })
  @ApiResponse({ status: 200, description: 'Trả về doanh thu từng tuần trong tháng' })
  getWeeklyGrowth() {
    return this.dashboardService.getWeeklyGrowth();
  }

  @Get('recent-orders')
  @ApiOperation({ summary: 'Đơn hàng gần đây' })
  @ApiResponse({ status: 200, description: 'Trả về danh sách đơn hàng mới nhất' })
  getRecentOrders() {
    return this.dashboardService.getRecentOrders();
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Sản phẩm bán chạy nhất' })
  @ApiResponse({ status: 200, description: 'Trả về top 5 sản phẩm bán chạy' })
  getTopProducts() {
    return this.dashboardService.getTopProducts();
  }
}
