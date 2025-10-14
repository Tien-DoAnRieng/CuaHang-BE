import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateProductImageDto {
  @IsString()
  productId: string;

  @IsString()
  @IsOptional()
  variantId?: string;

  @IsString()
  imageUrl: string;

  @IsBoolean()
  @IsOptional()
  isMain?: boolean;
}
