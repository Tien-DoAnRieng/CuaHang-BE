// src/queue/queue.service.ts
import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bull';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(@InjectQueue('email') private readonly emailQueue: Queue) {
    // Kiểm tra kết nối Redis khi khởi tạo
    // Lưu ý: Không dùng enableReadyCheck trong queue config vì Bull không cho phép
    this.emailQueue.on('error', (error: any) => {
      this.logger.error('❌ Queue error (Redis connection issue):', error);
      if ((error as any)?.code === 'ECONNREFUSED' || error?.message?.includes('ECONNREFUSED') || error?.message?.includes('redis')) {
        this.logger.warn('⚠️ Redis không kết nối được. Vui lòng cài đặt và khởi động Redis server.');
      }
    });

    this.emailQueue.on('waiting', (jobId) => {
      this.logger.debug(`⏳ Job ${jobId} is waiting`);
    });

    this.emailQueue.on('active', (job) => {
      this.logger.debug(`✅ Job ${job.id} is now active`);
    });

    this.emailQueue.on('completed', (job) => {
      this.logger.debug(`✅ Job ${job.id} completed`);
    });

    this.emailQueue.on('failed', (job, err) => {
      this.logger.error(`❌ Job ${job?.id} failed:`, err);
    });
  }

  async addEmailVerificationJob(data: { to: string; name: string; otp: string }) {
    try {
      await this.emailQueue.add('send-verification', data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      });
      this.logger.debug(`📧 Email verification job queued for ${data.to}`);
    } catch (error: any) {
      this.logger.error('❌ Failed to add email verification job:', error);
      throw error;
    }
  }

  async addOrderStatusEmailJob(data: { to: string; customerName: string; orderId: string; status: string; orderTotal: number }) {
    try {
      await this.emailQueue.add('send-order-status', data, {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: true,
        removeOnFail: false,
      });
      this.logger.debug(`📧 Order status email job queued for ${data.to}`);
    } catch (error: any) {
      this.logger.error('❌ Failed to add order status email job:', error);
      throw error;
    }
  }
}
