import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream, unlink } from 'fs';
import { join } from 'path';

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  constructor(private readonly configService: ConfigService) {}

  async getFileStream(filename: string) {
    const uploadPath = this.configService.get('UPLOAD_PATH', './uploads');
    const filePath = join(uploadPath, filename);
    return createReadStream(filePath);
  }

  async deleteFile(filename: string): Promise<boolean> {
    try {
      const uploadPath = this.configService.get('UPLOAD_PATH', './uploads');
      const filePath = join(uploadPath, filename);
      await new Promise((resolve, reject) => {
        unlink(filePath, (err) => {
          if (err) reject(err);
          resolve(true);
        });
      });
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete file ${filename}`, error);
      return false;
    }
  }

  getFileUrl(filename: string): string {
    const baseUrl = this.configService.get('APP_URL', 'http://localhost:3000');
    return `${baseUrl}/uploads/${filename}`;
  }
}