import {
  Controller,
  Post,
  Body,
  Put,
  Param,
  Get,
  Query,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { OrderService } from '../services/order.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderDto } from '../dto/update-order.dto';
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
  async placeOrder(@Body() dto: CreateOrderDto) {
    return this.orderService.placeOrder(dto);
  }

  // User: Cancel order
  @UseGuards(JwtAuthGuard)
  @Put(':id/cancel')
  @ApiOperation({ summary: 'User huỷ đơn hàng' })
  @ApiResponse({ status: 200, description: 'Huỷ đơn hàng thành công' })
  async cancelOrder(@Param('id') id: string) {
    return this.orderService.cancelOrder(id);
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
  @ApiOperation({ summary: 'Admin lấy chi tiết đơn hàng' })
  @ApiParam({ name: 'id', required: true, description: 'ID của đơn hàng' })
  async findOne(@Param('id') id: string) {
    return this.orderService.findOne(id);
  }

  // Admin: Update order
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Put(':id')
  @ApiOperation({ summary: 'Admin cập nhật đơn hàng' })
  @ApiBody({ type: UpdateOrderDto })
  @ApiParam({ name: 'id', required: true, description: 'ID của đơn hàng cần cập nhật' })
  async update(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.orderService.update(id, dto);
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
