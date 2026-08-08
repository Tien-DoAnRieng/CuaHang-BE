import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateFaqDto {
  @ApiProperty({ example: 'Chính sách đổi trả của shop như thế nào?', required: false })
  @IsString()
  @IsOptional()
  question?: string;

  @ApiProperty({ example: 'Shop hỗ trợ đổi trả miễn phí trong vòng 7 ngày...', required: false })
  @IsString()
  @IsOptional()
  answer?: string;

  @ApiProperty({ example: 'return_policy', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 'đổi trả, hoàn tiền', required: false })
  @IsString()
  @IsOptional()
  keywords?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
