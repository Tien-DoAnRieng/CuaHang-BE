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
      try {
        await this.mailerService.sendMail({
          to,
          subject: 'Mã xác thực tài khoản của bạn',
          template: 'verify-email',
          context: { name, otp },
        });
      } catch (tmplErr) {
        this.logger.warn(`⚠️ Template verify-email failed in queue, using HTML fallback:`, tmplErr);
        await this.mailerService.sendMail({
          to,
          subject: 'Mã xác thực tài khoản của bạn',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>Xin chào ${name},</h2>
              <p>Mã xác thực tài khoản của bạn là:</p>
              <h1 style="color: #2563eb; letter-spacing: 4px;">${otp}</h1>
              <p>Mã này có hiệu lực trong 10 phút.</p>
              <hr/>
              <p>Trân trọng,<br/>Đội ngũ hỗ trợ</p>
            </div>
          `,
        });
      }

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

      try {
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
      } catch (tmplErr) {
        this.logger.warn(`⚠️ Template order-status failed in queue, using HTML fallback:`, tmplErr);
        await this.mailerService.sendMail({
          to,
          subject: `Thông báo cập nhật trạng thái đơn hàng #${orderId}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2>Thông báo cập nhật đơn hàng</h2>
              <p>Xin chào <strong>${customerName || 'Quý khách'}</strong>,</p>
              <p>Chúng tôi xin thông báo về tình trạng đơn hàng của bạn:</p>
              <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p><strong>Mã đơn hàng:</strong> #${orderId}</p>
                <p><strong>Trạng thái:</strong> ${statusText}</p>
                <p><strong>Tổng tiền:</strong> ${orderTotal.toLocaleString('vi-VN')}₫</p>
              </div>
              <p>Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi!</p>
            </div>
          `,
        });
      }

      this.logger.log(`✅ Gửi email thông báo trạng thái đơn hàng thành công tới ${to}`);
    } catch (err) {
      this.logger.error(`❌ Gửi email thông báo trạng thái đơn hàng thất bại tới ${to}`, err);
      throw err;
    }
  }
}
