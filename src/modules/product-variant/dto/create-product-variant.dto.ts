import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateProductVariantDto {
  @IsString()
  productId: string;

  @IsString()
  colorId: string;

  @IsString()
  sizeId: string;

  @IsNumber()
  stockQuantity: number;

  @IsNumber()
  @IsOptional()
  priceOverride?: number;
}
