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
   * Gửi email qua Brevo REST API (Port 443 HTTPS - chạy mượt mà trên Render không bị chặn cổng)
   */
  private static async sendViaBrevo(options: SendMailOptions): Promise<boolean> {
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (!brevoApiKey) return false;

    const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.MAIL_USER || 'anbk27122005@gmail.com';
    const senderName = process.env.BREVO_SENDER_NAME || 'E-Commerce Shop';

    try {
      this.logger.log(`📧 [Brevo HTTP] Đang gửi email đến ${options.to} (Tiêu đề: "${options.subject}")...`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': brevoApiKey,
          'content-type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          sender: {
            name: senderName,
            email: senderEmail,
          },
          to: [
            {
              email: options.to,
            },
          ],
          subject: options.subject,
          htmlContent: options.html,
        }),
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (response.ok && data.messageId) {
        this.logger.log(`✅ [Brevo HTTP] Gửi email thành công tới ${options.to}! MessageID: ${data.messageId}`);
        return true;
      } else {
        this.logger.warn(`⚠️ [Brevo HTTP] Thất bại (Status ${response.status}):`, data);
        return false;
      }
    } catch (err: any) {
      this.logger.error(`❌ [Brevo HTTP] Lỗi gọi Brevo API: ${err.message}`, err);
      return false;
    }
  }

  /**
   * Gửi email ưu tiên:
   * 1. Brevo HTTP API (Port 443 - gửi được cho MỌI email)
   * 2. Resend HTTP API (Port 443)
   * 3. MailerService (Nodemailer SMTP)
   */
  static async sendMail(options: SendMailOptions, fallbackMailerService?: MailerService): Promise<boolean> {
    // 1️⃣ Ưu tiên Brevo API (Gửi được cho mọi email khách hàng, chạy trên HTTPS 443)
    if (process.env.BREVO_API_KEY) {
      const brevoSent = await this.sendViaBrevo(options);
      if (brevoSent) return true;
    }

    // 2️⃣ Kế tiếp thử Resend API
    const resend = this.getResend();
    if (resend) {
      try {
        const from = process.env.RESEND_FROM || 'E-Commerce <onboarding@resend.dev>';
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

    // 3️⃣ Fallback sang MailerService (SMTP)
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
