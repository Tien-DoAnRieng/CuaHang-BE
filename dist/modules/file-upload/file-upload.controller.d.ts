import type { Response } from 'express';
import { FileUploadService } from './file-upload.service';
export declare class FileUploadController {
    private readonly fileUploadService;
    constructor(fileUploadService: FileUploadService);
    uploadFile(file: Express.Multer.File): Promise<{
        filename: string;
        originalname: string;
        mimetype: string;
        size: number;
        url: string;
    }>;
    getFile(filename: string, res: Response): Promise<void>;
    deleteFile(filename: string): Promise<{
        success: boolean;
    }>;
}
