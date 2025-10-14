import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendEmail(
    to: string,
    subject: string,
    template: string,
    context: any,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to,
      subject,
      template,
      context,
    });
  }

  async sendPasswordReset(
    to: string,
    token: string,
    username: string,
  ): Promise<void> {
    const url = `example.com/auth/reset-password?token=${token}`;
    await this.sendEmail(to, 'Password Reset', 'password-reset', {
      username,
      url,
    });
  }

  async sendWelcome(to: string, username: string): Promise<void> {
    await this.sendEmail(to, 'Welcome to Our Platform', 'welcome', {
      username,
    });
  }
}