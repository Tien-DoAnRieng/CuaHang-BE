import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    const cloudinaryConfig = this.configService.get('cloudinary');
    cloudinary.config({
      cloud_name: cloudinaryConfig?.cloudName,
      api_key: cloudinaryConfig?.apiKey,
      api_secret: cloudinaryConfig?.apiSecret,
    });
  }

  async uploadSingle(file: Express.Multer.File): Promise<UploadApiResponse> {
    if (!file) {
      throw new Error('No file provided');
    }
    if (!file.buffer || file.buffer.length === 0) {
      throw new Error('File buffer is empty');
    }
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
        if (error || !result) return reject(error || new Error('No result from Cloudinary'));
        resolve(result);
      }).end(file.buffer);
    });
  }

  async uploadMultiple(files: Express.Multer.File[]): Promise<UploadApiResponse[]> {
    return Promise.all(files.map(file => this.uploadSingle(file)));
  }

  async remove(publicId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  }
}
