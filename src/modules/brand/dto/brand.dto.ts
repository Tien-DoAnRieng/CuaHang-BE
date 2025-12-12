import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBrandDto {
  @IsNotEmpty({ message: 'Tên thương hiệu không được để trống.' })
  @IsString({ message: 'Tên thương hiệu phải là chuỗi.' })
  @MaxLength(255, { message: 'Tên thương hiệu không được vượt quá 255 ký tự.' })
  @ApiProperty({ example: 'Nike', description: 'Tên thương hiệu' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi.' })
  @ApiProperty({ example: 'Thương hiệu thể thao nổi tiếng', required: false })
  description?: string;
}

export class UpdateBrandDto {
  @IsOptional()
  @IsString({ message: 'Tên thương hiệu phải là chuỗi.' })
  @MaxLength(255, { message: 'Tên thương hiệu không được vượt quá 255 ký tự.' })
  @ApiProperty({ example: 'Nike Sport', required: false })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi.' })
  @ApiProperty({ example: 'Thương hiệu thể thao hàng đầu', required: false })
  description?: string;
}




