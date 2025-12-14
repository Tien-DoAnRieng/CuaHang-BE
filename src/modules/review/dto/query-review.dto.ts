import { IsOptional, IsNumberString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryReviewDto {
  @IsOptional()
  @ApiPropertyOptional({ example: 'uuid-product' })
  productId?: string;

  @IsOptional()
  @ApiPropertyOptional({ example: 'uuid-user' })
  userId?: string;

  @IsOptional()
  @IsNumberString()
  @ApiPropertyOptional({ example: '1' })
  page?: string;

  @IsOptional()
  @IsNumberString()
  @ApiPropertyOptional({ example: '10' })
  limit?: string;

  @IsOptional()
  @ApiPropertyOptional({ example: 'approved', enum: ['all', 'pending', 'approved', 'violated'] })
  status?: string;
}
