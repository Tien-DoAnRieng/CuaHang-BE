import { IsOptional, IsString, IsNumberString, IsNumber } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ImportProductRowDto {
  @IsString()
  @ApiPropertyOptional({ example: 'Áo thun basic', description: 'Tên sản phẩm' })
  name: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Mô tả sản phẩm', required: false })
  description?: string;

  @IsNumberString()
  @ApiPropertyOptional({ example: '199000', description: 'Giá (số)', required: true })
  price: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Thương hiệu A', required: false })
  brand?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Áo', required: false })
  category?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'ACTIVE', required: false })
  status?: string;

  // Variant fields (optional)
  // (note: SKU not persisted by current schema; use color+size to identify variants)

  @IsOptional()
  @IsString()
  variant_color?: string;

  @IsOptional()
  @IsString()
  variant_size?: string;

  @IsOptional()
  @IsNumberString()
  variant_price?: string;

  @IsOptional()
  @IsNumberString()
  variant_stock?: string;

  @IsOptional()
  @IsString()
  image_urls?: string; // comma separated
}
