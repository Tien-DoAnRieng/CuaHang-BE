import { MailerService } from '@nestjs-modules/mailer';
export declare class MailService {
    private mailerService;
    constructor(mailerService: MailerService);
    sendEmail(to: string, subject: string, template: string, context: any): Promise<void>;
    sendPasswordReset(to: string, token: string, username: string): Promise<void>;
    sendWelcome(to: string, username: string): Promise<void>;
}
