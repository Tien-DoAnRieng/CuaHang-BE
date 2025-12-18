import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class SendMessageDto {
  @ApiProperty({ example: 'Tôi muốn hỏi về sản phẩm này' })
  @IsString()
  @IsNotEmpty()
  message: string;
}
