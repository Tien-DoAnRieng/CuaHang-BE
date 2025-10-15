import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Get,
  Param,
  Delete,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { FileUploadService } from './file-upload.service';

@Controller('uploads')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    return {
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: this.fileUploadService.getFileUrl(file.filename),
    };
  }

  @Get(':filename')
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    const fileStream = await this.fileUploadService.getFileStream(filename);
    fileStream.pipe(res);
  }

  @Delete(':filename')
  async deleteFile(@Param('filename') filename: string) {
    const deleted = await this.fileUploadService.deleteFile(filename);
    return { success: deleted };
  }
}
