import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Query,
  Param,
  Patch,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { PaymentService } from '../services/payment.service';
import { MomoService } from '../services/momo.service';
import { VnpayService } from '../services/vnpay.service';
import { Public } from '../../../common/decorators/public.decorator';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { UpdatePaymentStatusDto } from '../dto/update-payment-status.dto';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { RoleEnum } from '../../../common/enums/role.enum';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../../shared/schemas/entities/payment.entity';
import { Order } from '../../../shared/schemas/entities/order.entity';
import { Logger } from '@nestjs/common';
@ApiTags('Payments')
@Controller('payments')
export class PaymentController {
  private readonly logger = new Logger(PaymentController.name);
  constructor(
    private readonly paymentService: PaymentService,
    private readonly momoService: MomoService,
    private readonly vnpayService: VnpayService,

    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,

    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  // ---------------------------------------------
  // USER PAYMENT APIs
  // ---------------------------------------------
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'User: Tạo thanh toán cho đơn hàng' })
  @ApiBody({ type: CreatePaymentDto })
  async create(@Req() req: any, @Body() dto: CreatePaymentDto) {
    const userId = req.user?.id;
    return this.paymentService.create(dto as any, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'User: Danh sách thanh toán của chính mình' })
  async findMyPayments(@Req() req: any, @Query('page') page = 1, @Query('limit') limit = 10) {
    const userId = req.user?.id;
    return this.paymentService.findByUser(userId, {
      page: Number(page),
      limit: Number(limit),
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'User/Admin: Xem chi tiết payment' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['order'],
    });
    if (!payment) return null;

    const userId = req.user?.id;
    const roles = req.user?.roles || [];
    const isAdmin = roles.includes(RoleEnum.ADMIN);

    if (!isAdmin && payment.order?.userId !== userId) return null;

    return payment;
  }

  // ---------------------------------------------
  // ADMIN APIs
  // ---------------------------------------------
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Get()
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Admin: Danh sách tất cả thanh toán' })
  async findAll(@Query('search') search?: string, @Query('page') page = 1, @Query('limit') limit = 10) {
    return this.paymentService.findAll({
      search,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @Patch(':id/status')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Admin: Cập nhật trạng thái payment' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdatePaymentStatusDto) {
    return this.paymentService.updateStatus(id, dto.status);
  }

  // ---------------------------------------------
  // MOMO PAYMENT
  // ---------------------------------------------
  @UseGuards(JwtAuthGuard)
  @Post('momo/create')
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'User: Tạo payment Momo' })
  async createMomo(@Req() req: any, @Body() body: { orderId: string; amount?: number; orderInfo?: string }) {
    if (!body.orderId) throw new BadRequestException('orderId is required');
    return this.momoService.createMomoPayment(body.orderId, body.amount ?? 0, body.orderInfo || 'Payment');
  }

  @Public()
  @Post('momo/notify')
  @ApiOperation({ summary: 'MoMo IPN notify' })
  async momoNotify(@Body() payload: any, @Query('skipVerify') skipVerify?: string) {
    const res = await this.momoService.handleMomoNotify(payload, skipVerify === 'true');
    return res.success ? { result: 'OK' } : { result: 'FAIL' };
  }

  @Public()
  @Get('success')
  @ApiOperation({ summary: 'Momo return URL' })
  async momoReturn(@Query() query: any) {
    await this.momoService.handleMomoNotify(query);
    return { message: 'Momo return processed', query };
  }

  // ---------------------------------------------
  // VNPAY PAYMENT
  // ---------------------------------------------
 // ---------------------------------------------
// VNPAY PAYMENT
// ---------------------------------------------

@UseGuards(JwtAuthGuard)
@Get('vnpay/create')
@ApiBearerAuth('access-token')
@ApiOperation({ summary: 'User: Tạo payment VNPAY' })
async createVnpay(@Query('orderId') orderId: string, @Req() req: any) {
  if (!orderId) throw new BadRequestException('orderId là bắt buộc');

  const order = await this.orderRepository.findOne({ where: { id: orderId } });
  if (!order) throw new BadRequestException('Order không tồn tại');

  const ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  // Gọi service để tạo URL thanh toán
  const paymentUrl = await this.vnpayService.createPaymentUrl({
    orderId: order.id,
    amount: order.totalAmount,
    ipAddr: String(ipAddress),
  });

  // Tạo bản ghi payment
  const payment = this.paymentRepository.create({
    order,
    status: 'PENDING',
    paymentMethod: 'VNPAY',
    paymentTime: new Date(),
  });
  await this.paymentRepository.save(payment);

  return { status: true, paymentUrl };
}

@Public()
@Get('vnpay/return')
@ApiOperation({ summary: 'VNPAY return URL (redirect)' })
async handleReturn(@Query() query: any) {
  try {
    const payment = await this.vnpayService.handleReturn(query);

    // Cập nhật trạng thái đơn hàng nếu thanh toán thành công
    if (payment.responseCode === '00') {
      const order = await this.orderRepository.findOne({ where: { id: payment.orderId } });
      if (order) {
        order.status = 'PAID';
        await this.orderRepository.save(order);
      }

      const payRecord = await this.paymentRepository.findOne({ where: { order: { id: payment.orderId } } });
      if (payRecord) {
        payRecord.status = 'SUCCESS';
        await this.paymentRepository.save(payRecord);
      }
    }

    return { status: true, message: 'Thanh toán thành công', data: payment };
  } catch (err: any) {
    return { status: false, message: err.message, data: query };
  }
}
@Public()
@Post('vnpay/ipn')
@ApiOperation({ summary: 'VNPAY IPN notify' })
async handleIpn(@Req() req: any, @Body() body: any) {
  // VNPAY gửi body dạng x-www-form-urlencoded, NestJS có thể parse thành req.body
  const payload = body || req.body;

  // Log body để debug
  this.logger.debug('VNPAY IPN payload:', payload);

  try {
    // Xác minh chữ ký và parse dữ liệu
    const payment = await this.vnpayService.handleIpn(payload);

    if (!payment?.data) {
      this.logger.warn('IPN invalid data:', payload);
      return { RspCode: '97', Message: 'Invalid data' };
    }

    const { orderId, responseCode } = payment.data;

    // Tìm order
    const order = await this.orderRepository.findOne({ where: { id: orderId } });
    if (!order) {
      this.logger.warn('IPN order not found:', orderId);
      return { RspCode: '01', Message: 'Order not found' };
    }

    // Nếu thanh toán thành công
    if (responseCode === '00') {
      order.status = 'PAID';
      await this.orderRepository.save(order);

      const payRecord = await this.paymentRepository.findOne({
        where: { order: { id: orderId } },
      });
      if (payRecord) {
        payRecord.status = 'SUCCESS';
        await this.paymentRepository.save(payRecord);
      }
    }

    // Trả về VNPAY RspCode 00 để VNPAY biết đã nhận thành công
    return { RspCode: '00', Message: 'Success' };
  } catch (err) {
    // Sai chữ ký
    this.logger.warn('IPN invalid signature or error', err);
    return { RspCode: '97', Message: 'Invalid signature' };
  }
}




}