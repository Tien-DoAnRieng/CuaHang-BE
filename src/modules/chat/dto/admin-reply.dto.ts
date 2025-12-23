import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

export class AdminReplyDto {
  @ApiProperty({ example: 'abc123-456-def' })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ example: 'Cảm ơn bạn đã liên hệ!' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/...', required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}
