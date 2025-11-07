import { Controller, Post, Body, UseGuards, Req, Get, Query, Param, Patch, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';
import { PaymentService } from '../services/payment.service';
import { MomoService } from '../services/momo.service';
import { Public } from '../../../common/decorators/public.decorator';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { UpdatePaymentStatusDto } from '../dto/update-payment-status.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleEnum } from '../../../common/enums/role.enum';

@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly momoService: MomoService,
  ) {}

  // User: create payment for own order
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'User: Tạo thanh toán cho đơn hàng của mình' })
  @ApiBody({ type: CreatePaymentDto })
  async create(@Req() req: any, @Body() dto: CreatePaymentDto) {
    const userId = req.user?.id;
    return this.paymentService.create(dto as any, userId);
  }

  // User: list own payments
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'User: Danh sách thanh toán của chính mình' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findMyPayments(@Req() req: any, @Query('page') page = 1, @Query('limit') limit = 10) {
    const userId = req.user?.id;
    return this.paymentService.findByUser(userId, { page: Number(page), limit: Number(limit) });
  }

  // Get payment detail (user can fetch own, admin can fetch any)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiParam({ name: 'id', required: true })
  @ApiOperation({ summary: 'Lấy chi tiết payment (user->own, admin->any)' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const payment = await this.paymentService.findOne(id);
    if (!payment) return null;
    const userId = req.user?.id;
    const roles = req.user?.roles || [];
    const isAdmin = Array.isArray(roles) && roles.includes(RoleEnum.ADMIN);
    if (!isAdmin && payment.order?.userId !== userId) {
      return null;
    }
    return payment;
  }

  // Admin: list all payments
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Admin: Danh sách tất cả payments (search/paging)' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findAll(@Query('search') search?: string, @Query('page') page = 1, @Query('limit') limit = 10) {
    return this.paymentService.findAll({ search, page: Number(page), limit: Number(limit) });
  }

  // Admin: update payment status
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Patch(':id/status')
  @ApiBearerAuth('access-token')
  @ApiBody({ type: UpdatePaymentStatusDto })
  @ApiOperation({ summary: 'Admin: Cập nhật trạng thái thanh toán' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdatePaymentStatusDto) {
    return this.paymentService.updateStatus(id, dto.status);
  }

  // Create Momo payment (returns payUrl to redirect user)
  @UseGuards(JwtAuthGuard)
  @Post('momo/create')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'User: Tạo payment Momo cho đơn hàng và trả về payUrl' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orderId: { type: 'string', example: 'uuid-order' },
        amount: { type: 'number', example: 100000 },
        orderInfo: { type: 'string', example: 'Thanh toan don hang #123' },
      },
      required: ['orderId'],
    },
  })
  async createMomo(@Req() req: any, @Body() body: { orderId: string; amount?: number; orderInfo?: string }) {
    const userId = req.user?.id;
    if (!body) throw new BadRequestException('Request body is required');
    if (!body.orderId) throw new BadRequestException('orderId is required');

    // Let MomoService validate order existence and create momo request
    const result = await this.momoService.createMomoPayment(body.orderId, body.amount ?? 0, body.orderInfo || 'Payment');
    return result;
  }

  // Momo server notify (IPN) - public endpoint
  @Public()
  @Post('momo/notify')
  @ApiOperation({ summary: 'Momo IPN notify endpoint' })
  async momoNotify(@Body() payload: any, @Query('skipVerify') skipVerify?: string) {
    const res = await this.momoService.handleMomoNotify(payload, skipVerify === 'true');
    if (res.success) return { result: 'OK' };
    return { result: 'FAIL' };
  }

  // Momo redirect return URL - public
  @Public()
  @Get('success')
  @ApiOperation({ summary: 'Handle momo redirect after payment' })
  async momoReturn(@Query() query: any) {
    await this.momoService.handleMomoNotify(query);
    return { message: 'Momo return processed', query };
  }
}
