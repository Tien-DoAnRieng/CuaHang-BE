import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Query,
  Delete,
  UseGuards,
  Patch,
  Req,
  Header,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { OrderService } from '../services/order.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Ownership } from '../../../common/decorators/ownership.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { OwnershipGuard } from '../../../common/guards/ownership.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RoleEnum } from '../../../common/enums/role.enum';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'User đặt hàng' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: 'Đặt hàng thành công' })
  async placeOrder(@Req() req: any, @Body() dto: CreateOrderDto) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    return this.orderService.placeOrder(dto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'User huỷ đơn hàng' })
  @ApiResponse({ status: 200, description: 'Huỷ đơn hàng thành công' })
  async cancelOrder(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.id;
    const roles = req.user?.roles || [];
    const isAdmin = Array.isArray(roles) && roles.includes(RoleEnum.ADMIN);
    return this.orderService.cancelOrder(id, userId, isAdmin);
  }
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'User: Lấy danh sách đơn hàng của chính mình' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findOwnOrders(@Req() req: any, @Query('page') page = 1, @Query('limit') limit = 10) {
    const userId = req.user?.id;
    return this.orderService.findByUser(userId, { page: Number(page), limit: Number(limit) });
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @Get()
  @ApiOperation({ summary: 'Admin/Seller: Tìm kiếm, phân trang đơn hàng (Cả Admin và Seller đều thấy tất cả đơn hàng)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Req() req: any,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const user = req.user;
    
    // Extract roles - hỗ trợ nhiều format
    let userRoles: string[] = [];
    if (Array.isArray(user?.roles)) {
      userRoles = user.roles.map((r: any) => (typeof r === 'string' ? r : (r.name || r)));
    } else if (user?.role) {
      const roleName = typeof user.role === 'string' ? user.role : (user.role.name || user.role);
      userRoles = [roleName];
    } else if (user?.roleName) {
      userRoles = [user.roleName];
    }
    
    // Cả Admin và Seller đều thấy tất cả đơn hàng (không filter theo sellerId)
    const sellerId = undefined; // Không filter, cho cả admin và seller thấy tất cả
    
    return this.orderService.findAll({ search, page, limit, sellerId });
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @Get(':id')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Admin/Seller: Lấy chi tiết đơn hàng (Cả Admin và Seller đều thấy tất cả đơn hàng)' })
  @ApiParam({ name: 'id', required: true, description: 'ID của đơn hàng' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    // Cả Admin và Seller đều có thể xem tất cả đơn hàng
    return this.orderService.findOne(id);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Admin/Seller cập nhật trạng thái đơn hàng (Cả Admin và Seller đều có thể cập nhật tất cả)' })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiParam({ name: 'id', required: true, description: 'ID của đơn hàng cần cập nhật trạng thái' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orderService.updateStatus(id, dto.status);
  }
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Admin xoá đơn hàng' })
  @ApiParam({ name: 'id', required: true, description: 'ID của đơn hàng cần xóa' })
  async remove(@Param('id') id: string) {
    return this.orderService.remove(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Post(':id/send-email')
  @ApiOperation({ summary: 'Admin: Gửi email thông báo trạng thái đơn hàng thủ công' })
  @ApiParam({ name: 'id', required: true, description: 'ID của đơn hàng' })
  async sendOrderEmail(@Param('id') id: string) {
    return this.orderService.sendOrderStatusEmail(id);
  }
}
