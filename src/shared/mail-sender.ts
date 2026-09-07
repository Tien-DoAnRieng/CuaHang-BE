import { Resend } from 'resend';
import { Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  template?: string;
  context?: any;
}

export class MailSender {
  private static readonly logger = new Logger(MailSender.name);
  private static resendClient: Resend | null = null;

  private static getResend(): Resend | null {
    const key = process.env.RESEND_API_KEY;
    if (key) {
      if (!this.resendClient) {
        this.resendClient = new Resend(key);
      }
      return this.resendClient;
    }
    return null;
  }

  /**
   * Gửi email ưu tiên qua Resend HTTP API (Port 443 - không bị chặn trên Render/Cloud),
   * nếu không có Resend hoặc lỗi sẽ fallback sang MailerService (Nodemailer SMTP).
   */
  static async sendMail(options: SendMailOptions, fallbackMailerService?: MailerService): Promise<boolean> {
    const resend = this.getResend();
    const from = process.env.RESEND_FROM || 'E-Commerce <onboarding@resend.dev>';

    // 1️⃣ Ưu tiên gửi qua Resend API (HTTP REST API qua cổng 443)
    if (resend) {
      try {
        this.logger.log(`📧 [Resend HTTP] Gửi email đến: ${options.to} (Tiêu đề: "${options.subject}")`);
        const result = await resend.emails.send({
          from,
          to: options.to,
          subject: options.subject,
          html: options.html,
        });

        if (result.error) {
          this.logger.warn(`⚠️ [Resend HTTP] Resend báo lỗi: ${result.error.message}`, result.error);
        } else {
          this.logger.log(`✅ [Resend HTTP] Gửi email thành công! Message ID: ${result.data?.id}`);
          return true;
        }
      } catch (err: any) {
        this.logger.error(`❌ [Resend HTTP] Ngoại lệ khi gọi Resend API: ${err.message}`, err);
      }
    }

    // 2️⃣ Fallback sang MailerService (SMTP)
    if (fallbackMailerService) {
      try {
        this.logger.log(`📧 [MailerService SMTP] Thử gửi qua SMTP tới ${options.to}`);
        if (options.template && options.context) {
          try {
            await fallbackMailerService.sendMail({
              to: options.to,
              subject: options.subject,
              template: options.template,
              context: options.context,
            });
            this.logger.log(`✅ [MailerService SMTP] Gửi qua template thành công tới ${options.to}`);
            return true;
          } catch (tmplErr) {
            this.logger.warn(`⚠️ [MailerService SMTP] Template thất bại, thử gửi trực tiếp HTML`);
          }
        }

        await fallbackMailerService.sendMail({
          to: options.to,
          subject: options.subject,
          html: options.html,
        });
        this.logger.log(`✅ [MailerService SMTP] Gửi HTML thành công tới ${options.to}`);
        return true;
      } catch (smtpErr: any) {
        this.logger.error(`❌ [MailerService SMTP] Gửi SMTP thất bại tới ${options.to}: ${smtpErr.message}`);
      }
    }

    return false;
  }
}
