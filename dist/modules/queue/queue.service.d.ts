import type { Queue } from 'bull';
export declare class QueueService {
    private readonly emailQueue;
    private readonly fileProcessingQueue;
    constructor(emailQueue: Queue, fileProcessingQueue: Queue);
    addEmailJob(jobName: string, data: any): Promise<void>;
    addFileProcessingJob(jobName: string, data: any): Promise<void>;
}
