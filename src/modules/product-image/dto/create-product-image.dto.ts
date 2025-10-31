import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductImageDto {
  @IsString()
  @ApiProperty({ example: 'uuid-product' })
  productId: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: null, required: false })
  variantId?: string;

  @IsString()
  @ApiProperty({ example: 'https://example.com/image.jpg' })
  imageUrl: string;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ example: true, required: false })
  isMain?: boolean;
}
