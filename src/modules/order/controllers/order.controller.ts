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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { OrderService } from '../services/order.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderStatusDto } from '../dto/update-order-status.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RoleEnum } from '../../../common/enums/role.enum';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // User: Place order
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'User đặt hàng' })
  @ApiBody({ type: CreateOrderDto })
  @ApiResponse({ status: 201, description: 'Đặt hàng thành công' })
  async placeOrder(@Req() req: any, @Body() dto: CreateOrderDto) {
    const userId = req.user?.id;
    if (!userId) throw new UnauthorizedException('User not authenticated');
    // ensure order uses authenticated user id (do not trust client-provided userId)
    dto.userId = userId;
    return this.orderService.placeOrder(dto);
  }

  // User: Cancel order
  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  @ApiOperation({ summary: 'User huỷ đơn hàng' })
  @ApiResponse({ status: 200, description: 'Huỷ đơn hàng thành công' })
  async cancelOrder(@Param('id') id: string) {
    return this.orderService.cancelOrder(id);
  }

  // User: Lấy danh sách đơn hàng của chính họ
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'User: Lấy danh sách đơn hàng của chính mình' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findOwnOrders(@Req() req: any, @Query('page') page = 1, @Query('limit') limit = 10) {
    const userId = req.user?.id;
    return this.orderService.findByUser(userId, { page: Number(page), limit: Number(limit) });
  }

  // Admin: List orders with search & pagination
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Admin tìm kiếm, phân trang đơn hàng' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.orderService.findAll({ search, page, limit });
  }

  // Admin: Get order by id
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Get(':id')
  @Header('Cache-Control', 'no-store')
  @ApiOperation({ summary: 'Admin lấy chi tiết đơn hàng' })
  @ApiParam({ name: 'id', required: true, description: 'ID của đơn hàng' })
  async findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  // Admin: Update order status only
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Admin cập nhật trạng thái đơn hàng' })
  @ApiBody({ type: UpdateOrderStatusDto })
  @ApiParam({ name: 'id', required: true, description: 'ID của đơn hàng cần cập nhật trạng thái' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orderService.updateStatus(id, dto.status);
  }

  // Admin: Delete order
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Admin xoá đơn hàng' })
  @ApiParam({ name: 'id', required: true, description: 'ID của đơn hàng cần xóa' })
  async remove(@Param('id') id: string) {
    return this.orderService.remove(id);
  }
}
