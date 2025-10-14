import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { diskStorage } from 'multer';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import { extname } from 'path';
import { FirebaseStorageService } from './firebase-storage.service';

@Module({
  imports: [
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        storage: diskStorage({
          destination: (req, file, cb) => {
            const uploadPath = configService.get('UPLOAD_PATH', './uploads');
            cb(null, uploadPath);
          },
          filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
          },
        }),
        fileFilter: (req, file, cb) => {
          if (!file.originalname.match(/\.(jpg|jpeg|png|gif|pdf|doc|docx)$/)) {
            return cb(new Error('Only image and document files are allowed!'), false);
          }
          cb(null, true);
        },
        limits: {
          fileSize: 5 * 1024 * 1024, // 5MB
        },
      }),
    }),
  ],
  controllers: [FileUploadController],
  providers: [FileUploadService, FirebaseStorageService],
  exports: [FileUploadService, FirebaseStorageService],
})
export class FileUploadModule {}