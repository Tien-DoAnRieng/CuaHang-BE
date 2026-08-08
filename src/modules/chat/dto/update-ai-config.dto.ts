import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateAiConfigDto {
  @ApiProperty({ description: 'Chỉ dẫn hệ thống chung cho Gemini', required: false })
  @IsString()
  @IsOptional()
  systemInstruction?: string;

  @ApiProperty({ description: 'Quy tắc kinh doanh và chiến lược bán hàng', required: false })
  @IsString()
  @IsOptional()
  businessRules?: string;

  @ApiProperty({ description: 'Độ sáng tạo của AI (0.0 đến 1.0)', required: false, example: 0.3 })
  @IsNumber()
  @Min(0)
  @Max(1)
  @IsOptional()
  temperature?: number;

  @ApiProperty({ description: 'Số lượt tin nhắn lịch sử nạp vào context memory', required: false, example: 8 })
  @IsNumber()
  @Min(1)
  @Max(30)
  @IsOptional()
  maxHistoryTurns?: number;

  @ApiProperty({ description: 'Danh sách từ khóa kích hoạt chuyển giao cho người thật (phân cách bằng dấu phẩy)', required: false })
  @IsString()
  @IsOptional()
  emergencyKeywords?: string;

  @ApiProperty({ description: 'Bật hoặc tắt phản hồi tự động AI', required: false })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}
