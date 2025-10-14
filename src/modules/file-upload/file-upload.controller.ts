import { Controller, Post, UploadedFile, UseInterceptors, BadRequestException, Get, Param, Delete, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBody, ApiResponse, ApiConsumes} from '@nestjs/swagger';
import { FileUploadService } from './file-upload.service';
import type { Response } from 'express';

@ApiTags('FileUpload')
@Controller('uploads')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}
@Post()
@ApiConsumes('multipart/form-data')
@ApiBody({
  description: 'Upload a file',
  schema: {
    type: 'object',
    properties: {
      file: { type: 'string', format: 'binary' },
    },
    required: ['file'], // 🔹 thêm required để Swagger hiển thị bắt buộc
  },
})

@UseInterceptors(FileInterceptor('file'))
async uploadFile(@UploadedFile() file: Express.Multer.File) {
  if (!file) throw new BadRequestException('No file uploaded');
  return {
    filename: file.filename,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
    url: this.fileUploadService.getFileUrl(file.filename),
  };
}



  // Firebase upload endpoint removed due to missing dependencies and errors

  @Get(':filename')
    @ApiResponse({ status: 200, description: 'Get file by filename', schema: { example: { file: 'file-123456.png' } } })
  async getFile(@Param('filename') filename: string, @Res() res: Response) {
    const fileStream = await this.fileUploadService.getFileStream(filename);
    fileStream.pipe(res);
  }

  @Delete(':filename')
    @ApiResponse({ status: 204, description: 'File deleted' })
  async deleteFile(@Param('filename') filename: string) {
    const deleted = await this.fileUploadService.deleteFile(filename);
    return { success: deleted };
  }
}