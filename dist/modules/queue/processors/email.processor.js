"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const mail_service_1 = require("../../mail/mail.service");
let EmailProcessor = EmailProcessor_1 = class EmailProcessor {
    mailService;
    logger = new common_1.Logger(EmailProcessor_1.name);
    constructor(mailService) {
        this.mailService = mailService;
    }
    async handleWelcomeEmail(job) {
        this.logger.debug('Processing welcome email job');
        try {
            await this.mailService.sendWelcome(job.data.email, job.data.username);
            this.logger.debug('Welcome email sent successfully');
        }
        catch (error) {
            this.logger.error('Failed to process welcome email job', error);
            throw error;
        }
    }
    async handlePasswordReset(job) {
        this.logger.debug('Processing password reset email job');
        try {
            await this.mailService.sendPasswordReset(job.data.email, job.data.token, job.data.username);
            this.logger.debug('Password reset email sent successfully');
        }
        catch (error) {
            this.logger.error('Failed to process password reset email job', error);
            throw error;
        }
    }
};
exports.EmailProcessor = EmailProcessor;
__decorate([
    (0, bull_1.Process)('welcome-email'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailProcessor.prototype, "handleWelcomeEmail", null);
__decorate([
    (0, bull_1.Process)('password-reset'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailProcessor.prototype, "handlePasswordReset", null);
exports.EmailProcessor = EmailProcessor = EmailProcessor_1 = __decorate([
    (0, bull_1.Processor)('email'),
    __metadata("design:paramtypes", [mail_service_1.MailService])
], EmailProcessor);
//# sourceMappingURL=email.processor.js.map