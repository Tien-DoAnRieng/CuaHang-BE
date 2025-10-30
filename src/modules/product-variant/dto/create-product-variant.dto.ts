import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductVariantDto {
  @IsString()
  @ApiProperty({ example: 'uuid-product' })
  productId: string;

  @IsString()
  @ApiProperty({ example: 'uuid-color' })
  colorId: string;

  @IsString()
  @ApiProperty({ example: 'uuid-size' })
  sizeId: string;

  @IsNumber()
  @ApiProperty({ example: 10 })
  stockQuantity: number;

  @IsNumber()
  @IsOptional()
  @ApiProperty({ example: 199.99, required: false })
  priceOverride?: number;
}
