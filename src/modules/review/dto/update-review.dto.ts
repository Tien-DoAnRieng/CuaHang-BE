import { IsOptional, IsInt, Min, Max, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateReviewDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  @ApiPropertyOptional({ example: 4 })
  rating?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Cập nhật: chất lượng tốt' })
  comment?: string;
}
