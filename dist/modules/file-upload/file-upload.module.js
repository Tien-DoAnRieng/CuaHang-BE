"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadModule = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const config_1 = require("@nestjs/config");
const multer_1 = require("multer");
const file_upload_service_1 = require("./file-upload.service");
const file_upload_controller_1 = require("./file-upload.controller");
const path_1 = require("path");
let FileUploadModule = class FileUploadModule {
};
exports.FileUploadModule = FileUploadModule;
exports.FileUploadModule = FileUploadModule = __decorate([
    (0, common_1.Module)({
        imports: [
            platform_express_1.MulterModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: async (configService) => ({
                    storage: (0, multer_1.diskStorage)({
                        destination: (req, file, cb) => {
                            const uploadPath = configService.get('UPLOAD_PATH', './uploads');
                            cb(null, uploadPath);
                        },
                        filename: (req, file, cb) => {
                            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                            cb(null, `${file.fieldname}-${uniqueSuffix}${(0, path_1.extname)(file.originalname)}`);
                        },
                    }),
                    fileFilter: (req, file, cb) => {
                        if (!file.originalname.match(/\.(jpg|jpeg|png|gif|pdf|doc|docx)$/)) {
                            return cb(new Error('Only image and document files are allowed!'), false);
                        }
                        cb(null, true);
                    },
                    limits: {
                        fileSize: 5 * 1024 * 1024,
                    },
                }),
            }),
        ],
        controllers: [file_upload_controller_1.FileUploadController],
        providers: [file_upload_service_1.FileUploadService],
        exports: [file_upload_service_1.FileUploadService],
    })
], FileUploadModule);
//# sourceMappingURL=file-upload.module.js.map