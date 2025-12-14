import { IsOptional, IsInt, Min, Max, IsString, Length, ValidateIf } from 'class-validator';
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
  @Length(0, 1000, { message: 'Bình luận không được vượt quá 1000 ký tự' })
  @ValidateIf((o) => o.comment !== undefined && o.comment !== null && o.comment !== '')
  @ApiPropertyOptional({ 
    example: 'Cập nhật: chất lượng tốt',
    description: 'Bình luận (tối đa 1000 ký tự, không chứa ký tự đặc biệt)'
  })
  comment?: string;
}
