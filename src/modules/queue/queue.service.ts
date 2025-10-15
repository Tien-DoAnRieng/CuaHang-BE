import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bull';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectQueue('file-processing') private readonly fileProcessingQueue: Queue,
  ) {}

  async addEmailJob(jobName: string, data: any) {
    await this.emailQueue.add(jobName, data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
    });
  }

  async addFileProcessingJob(jobName: string, data: any) {
    await this.fileProcessingQueue.add(jobName, data, {
      attempts: 2,
      backoff: {
        type: 'fixed',
        delay: 5000,
      },
    });
  }
}
