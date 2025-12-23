import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 'Tôi muốn hỏi về sản phẩm này' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({ example: 'https://res.cloudinary.com/...', required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}
