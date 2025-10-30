import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @IsString()
  @ApiProperty({ example: 'Áo thun basic' })
  name: string;

  @IsString()
  @ApiProperty({ example: 'Áo thun cotton, ôm vừa' })
  description: string;

  @IsNumber()
  @ApiProperty({ example: 199000 })
  price: number;

  @IsString()
  @ApiProperty({ example: 'Thương hiệu A' })
  brand: string;

  @IsString()
  @ApiProperty({ example: 'uuid-category' })
  category: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ example: 'ACTIVE', required: false })
  status?: string;
}
