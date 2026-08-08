import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateFaqDto {
  @ApiProperty({ example: 'Chính sách đổi trả của shop như thế nào?' })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({ example: 'Shop hỗ trợ đổi trả miễn phí trong vòng 7 ngày kể từ khi nhận hàng.' })
  @IsString()
  @IsNotEmpty()
  answer: string;

  @ApiProperty({ example: 'return_policy', required: false })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: 'đổi trả, hoàn tiền, trả hàng, lỗi', required: false })
  @IsString()
  @IsOptional()
  keywords?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
