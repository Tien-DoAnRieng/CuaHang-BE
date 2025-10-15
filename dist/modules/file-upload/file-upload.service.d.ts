import { ConfigService } from '@nestjs/config';
export declare class FileUploadService {
    private readonly configService;
    private readonly logger;
    constructor(configService: ConfigService);
    getFileStream(filename: string): Promise<import("fs").ReadStream>;
    deleteFile(filename: string): Promise<boolean>;
    getFileUrl(filename: string): string;
}
