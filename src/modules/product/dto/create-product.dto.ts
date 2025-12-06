import { IsString, IsNumber, IsOptional, IsBoolean, ValidateNested, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class VariantDto {
  @IsString()
  @ApiProperty({ example: 'uuid-size', required: false })
  sizeId?: string;

  @IsString()
  @ApiProperty({ example: 'uuid-color', required: false })
  colorId?: string;

  @IsNumber()
  @ApiProperty({ example: 10 })
  stockQuantity: number;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ example: 99000, required: false })
  priceOverride?: number;
}

export class CreateProductDto {
  @IsString() name: string;
  @IsString() @IsOptional() description?: string;
  @IsNumber() price: number;
  @IsString() brand: string;
  @IsString() category: string;
  @IsOptional() status?: string;

  // Variant
  @IsBoolean() @IsOptional() hasVariants?: boolean;
  @IsArray() @ValidateNested({ each: true }) @Type(() => VariantDto) @IsOptional()
  variants?: VariantDto[];
}
