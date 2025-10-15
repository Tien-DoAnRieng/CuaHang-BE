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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
let QueueService = class QueueService {
    emailQueue;
    fileProcessingQueue;
    constructor(emailQueue, fileProcessingQueue) {
        this.emailQueue = emailQueue;
        this.fileProcessingQueue = fileProcessingQueue;
    }
    async addEmailJob(jobName, data) {
        await this.emailQueue.add(jobName, data, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
        });
    }
    async addFileProcessingJob(jobName, data) {
        await this.fileProcessingQueue.add(jobName, data, {
            attempts: 2,
            backoff: {
                type: 'fixed',
                delay: 5000,
            },
        });
    }
};
exports.QueueService = QueueService;
exports.QueueService = QueueService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bull_1.InjectQueue)('email')),
    __param(1, (0, bull_1.InjectQueue)('file-processing')),
    __metadata("design:paramtypes", [Object, Object])
], QueueService);
//# sourceMappingURL=queue.service.js.map