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
var FileUploadService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs_1 = require("fs");
const path_1 = require("path");
let FileUploadService = FileUploadService_1 = class FileUploadService {
    configService;
    logger = new common_1.Logger(FileUploadService_1.name);
    constructor(configService) {
        this.configService = configService;
    }
    async getFileStream(filename) {
        const uploadPath = this.configService.get('UPLOAD_PATH', './uploads');
        const filePath = (0, path_1.join)(uploadPath, filename);
        return (0, fs_1.createReadStream)(filePath);
    }
    async deleteFile(filename) {
        try {
            const uploadPath = this.configService.get('UPLOAD_PATH', './uploads');
            const filePath = (0, path_1.join)(uploadPath, filename);
            await new Promise((resolve, reject) => {
                (0, fs_1.unlink)(filePath, (err) => {
                    if (err)
                        reject(err);
                    resolve(true);
                });
            });
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to delete file ${filename}`, error);
            return false;
        }
    }
    getFileUrl(filename) {
        const baseUrl = this.configService.get('APP_URL', 'http://localhost:3000');
        return `${baseUrl}/uploads/${filename}`;
    }
};
exports.FileUploadService = FileUploadService;
exports.FileUploadService = FileUploadService = FileUploadService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FileUploadService);
//# sourceMappingURL=file-upload.service.js.map