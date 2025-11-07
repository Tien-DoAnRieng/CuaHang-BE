import { IsString, IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateReviewDto {
  @IsString()
  @ApiProperty({ example: 'uuid-product' })
  productId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  @ApiProperty({ example: 5, description: 'Rating 1-5' })
  rating: number;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'Sản phẩm tốt, giao nhanh', required: false })
  comment?: string;
}
