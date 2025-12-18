import { IsString, IsNumber, IsOptional, IsBoolean, ValidateNested, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class VariantDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'uuid-size', required: false })
  sizeId?: string | null;

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
  @IsString() @IsOptional() brand?: string; // Giữ lại để backward compatibility
  @IsString() @IsOptional() brandId?: string; // Thêm brandId
  @IsString() category: string;
  @IsOptional() status?: string;
  @IsBoolean() @IsOptional() hasVariants?: boolean;
  @IsString() @IsOptional() imageUrl?: string; // Thêm imageUrl
  @IsArray() @ValidateNested({ each: true }) @Type(() => VariantDto) @IsOptional()
  variants?: VariantDto[];
}
