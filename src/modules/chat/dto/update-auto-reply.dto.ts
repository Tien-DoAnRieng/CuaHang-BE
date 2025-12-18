import { IsString, IsBoolean, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateAutoReplyDto {
  @ApiProperty({ description: 'Nội dung tin nhắn tự động' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Bật/tắt auto-reply', required: false })
  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @ApiProperty({ description: 'Thời gian cooldown (giây)', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cooldownSeconds?: number;
}
