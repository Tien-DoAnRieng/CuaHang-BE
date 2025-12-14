// src/queue/email.processor.ts
import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';
import { Logger } from '@nestjs/common';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailerService: MailerService) {}

  @Process('send-verification')
  async handleEmailVerification(job: Job<{ to: string; name: string; otp: string }>) {
    const { to, name, otp } = job.data;

    this.logger.debug(`📧 Gửi email xác thực đến: ${to}`);

    try {
      await this.mailerService.sendMail({
        to,
        subject: 'Mã xác thực tài khoản của bạn',
        template: 'verify-otp', // verify-otp.hbs
        context: { name, otp },
      });

      this.logger.log(`✅ Gửi OTP thành công tới ${to}`);
    } catch (err) {
      this.logger.error(`❌ Gửi OTP thất bại tới ${to}`, err);
      throw err;
    }
  }

  @Process('send-order-status')
  async handleOrderStatusEmail(job: Job<{ to: string; customerName: string; orderId: string; status: string; orderTotal: number }>) {
    const { to, customerName, orderId, status, orderTotal } = job.data;

    this.logger.debug(`📧 Gửi email thông báo trạng thái đơn hàng đến: ${to}`);

    try {
      // Map status to Vietnamese
      const statusMap: Record<string, string> = {
        'PENDING': 'Đang chờ xử lý',
        'PROCESSING': 'Đang xử lý',
        'PAID': 'Đã thanh toán',
        'SHIPPED': 'Đã giao hàng',
        'DELIVERED': 'Đã nhận hàng',
        'COMPLETED': 'Hoàn thành',
        'CANCELLED': 'Đã hủy',
        'REFUNDED': 'Đã hoàn tiền',
      };

      const statusText = statusMap[status] || status;

      await this.mailerService.sendMail({
        to,
        subject: `Thông báo cập nhật trạng thái đơn hàng #${orderId}`,
        template: 'order-status',
        context: {
          customerName: customerName || 'Quý khách',
          orderId,
          status: statusText,
          orderTotal: orderTotal.toLocaleString('vi-VN'),
        },
      });

      this.logger.log(`✅ Gửi email thông báo trạng thái đơn hàng thành công tới ${to}`);
    } catch (err) {
      this.logger.error(`❌ Gửi email thông báo trạng thái đơn hàng thất bại tới ${to}`, err);
      throw err;
    }
  }
}
