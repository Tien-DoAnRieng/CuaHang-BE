import { IsString, IsInt, Min, Max, IsOptional, Length, Matches, ValidateIf } from 'class-validator';
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
  @Length(0, 1000, { message: 'Bình luận không được vượt quá 1000 ký tự' })
  @ValidateIf((o) => o.comment !== undefined && o.comment !== null && o.comment !== '')
  @Matches(/^[^<>{}[\]\\|`]*$/, {
    message: 'Bình luận không được chứa các ký tự: < > { } [ ] \\ | `',
  })
  @ApiProperty({ 
    example: 'Sản phẩm tốt, giao nhanh', 
    required: false,
    description: 'Bình luận (tối đa 1000 ký tự, không chứa ký tự đặc biệt nguy hiểm)'
  })
  comment?: string;
}
