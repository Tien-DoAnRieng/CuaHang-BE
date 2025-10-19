import {
  Controller,
  Post,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Body,
  Delete,
  Param,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBody, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CloudinaryService } from '../services/cloudinary.service';

@ApiTags('CloudinaryUpload')
@Controller('cloudinary')
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('single')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload single image',
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
      required: ['file'],
    },
  })
  @ApiResponse({ status: 201, description: 'Image uploaded successfully' })
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  async uploadSingle(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    return await this.cloudinaryService.uploadSingle(file);
  }

  @Post('multiple')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Upload multiple images',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
        },
      },
      required: ['files'],
    },
  })
  @ApiResponse({ status: 201, description: 'Images uploaded successfully' })
  @UseInterceptors(FilesInterceptor('files', 10, { storage: memoryStorage() }))
  async uploadMultiple(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) throw new BadRequestException('No files uploaded');
    return await this.cloudinaryService.uploadMultiple(files);
  }

  @Delete('remove/:publicId')
  @ApiResponse({ status: 200, description: 'Image removed successfully' })
  async remove(@Param('publicId') publicId: string) {
    return await this.cloudinaryService.remove(publicId);
  }
}
