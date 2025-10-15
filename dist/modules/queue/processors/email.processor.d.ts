import type { Job } from 'bull';
import { MailService } from '../../mail/mail.service';
export declare class EmailProcessor {
    private readonly mailService;
    private readonly logger;
    constructor(mailService: MailService);
    handleWelcomeEmail(job: Job<{
        email: string;
        username: string;
    }>): Promise<void>;
    handlePasswordReset(job: Job<{
        email: string;
        token: string;
        username: string;
    }>): Promise<void>;
}
