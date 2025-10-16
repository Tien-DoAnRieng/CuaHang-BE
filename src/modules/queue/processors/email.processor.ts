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
}
