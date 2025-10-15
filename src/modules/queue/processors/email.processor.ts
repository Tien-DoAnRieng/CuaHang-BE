import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { MailService } from '../../mail/mail.service';

@Processor('email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly mailService: MailService) {}

  @Process('welcome-email')
  async handleWelcomeEmail(job: Job<{ email: string; username: string }>) {
    this.logger.debug('Processing welcome email job');
    try {
      await this.mailService.sendWelcome(job.data.email, job.data.username);
      this.logger.debug('Welcome email sent successfully');
    } catch (error) {
      this.logger.error('Failed to process welcome email job', error);
      throw error;
    }
  }

  @Process('password-reset')
  async handlePasswordReset(
    job: Job<{ email: string; token: string; username: string }>,
  ) {
    this.logger.debug('Processing password reset email job');
    try {
      await this.mailService.sendPasswordReset(
        job.data.email,
        job.data.token,
        job.data.username,
      );
      this.logger.debug('Password reset email sent successfully');
    } catch (error) {
      this.logger.error('Failed to process password reset email job', error);
      throw error;
    }
  }

}
