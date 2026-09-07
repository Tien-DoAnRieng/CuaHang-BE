// src/queue/email.processor.ts
import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { MailerService } from '@nestjs-modules/mailer';
import { Logger } from '@nestjs/common';
import { MailSender } from '../../../shared/mail-sender';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailerService: MailerService) {}

  @Process('send-verification')
  async handleEmailVerification(job: Job<{ to: string; name: string; otp: string }>) {
    const { to, name, otp } = job.data;

    this.logger.debug(`📧 Gửi email xác thực đến: ${to}`);

    try {
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2>Xin chào ${name},</h2>
          <p>Mã xác thực tài khoản của bạn là:</p>
          <h1 style="color: #2563eb; letter-spacing: 4px; font-size: 32px;">${otp}</h1>
          <p>Mã này có hiệu lực trong 10 phút.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
          <p style="color: #64748b; font-size: 14px;">Trân trọng,<br/>Đội ngũ hỗ trợ E-Commerce</p>
        </div>
      `;

      const success = await MailSender.sendMail(
        {
          to,
          subject: 'Mã xác thực tài khoản của bạn',
          html,
          template: 'verify-email',
          context: { name, otp },
        },
        this.mailerService,
      );

      if (success) {
        this.logger.log(`✅ Gửi OTP thành công tới ${to}`);
      } else {
        throw new Error(`Gửi email OTP tới ${to} thất bại`);
      }
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

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #4f46e5;">Thông báo cập nhật đơn hàng</h2>
          <p>Xin chào <strong>${customerName || 'Quý khách'}</strong>,</p>
          <p>Chúng tôi xin thông báo về tình trạng đơn hàng của bạn:</p>
          <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 5px 0;"><strong>Mã đơn hàng:</strong> #${orderId}</p>
            <p style="margin: 5px 0;"><strong>Trạng thái:</strong> <span style="background: #4f46e5; color: white; padding: 3px 8px; border-radius: 12px; font-size: 13px;">${statusText}</span></p>
            <p style="margin: 5px 0;"><strong>Tổng tiền:</strong> ${orderTotal.toLocaleString('vi-VN')}₫</p>
          </div>
          <p>Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của chúng tôi!</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;"/>
          <p style="color: #64748b; font-size: 12px;">Đây là email tự động, vui lòng không trả lời email này.</p>
        </div>
      `;

      const success = await MailSender.sendMail(
        {
          to,
          subject: `Thông báo cập nhật trạng thái đơn hàng #${orderId}`,
          html,
          template: 'order-status',
          context: {
            customerName: customerName || 'Quý khách',
            orderId,
            status: statusText,
            orderTotal: orderTotal.toLocaleString('vi-VN'),
          },
        },
        this.mailerService,
      );

      if (success) {
        this.logger.log(`✅ Gửi email thông báo trạng thái đơn hàng thành công tới ${to}`);
      } else {
        throw new Error(`Gửi email thông báo đơn hàng #${orderId} tới ${to} thất bại`);
      }
    } catch (err) {
      this.logger.error(`❌ Gửi email thông báo trạng thái đơn hàng thất bại tới ${to}`, err);
      throw err;
    }
  }
}

