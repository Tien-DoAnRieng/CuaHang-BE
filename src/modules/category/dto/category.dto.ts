import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/** DTO dùng cho việc TẠO danh mục mới */
export class CreateCategoryDto {
  @IsNotEmpty({ message: 'Tên danh mục không được để trống.' })
  @IsString({ message: 'Tên danh mục phải là chuỗi.' })
  @MaxLength(255, { message: 'Tên danh mục không được vượt quá 255 ký tự.' })
  @ApiProperty({ example: 'Giày dép', description: 'Tên danh mục' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi.' })
  @ApiProperty({ example: 'Danh mục giày dép nam, nữ', required: false })
  description?: string;

  @IsOptional()
  @IsString({ message: 'parentId phải là chuỗi.' })
  @ApiProperty({ example: null, required: false, description: 'ID danh mục mẹ nếu có' })
  parentId?: string;
}

/** DTO dùng cho việc CẬP NHẬT danh mục */
export class UpdateCategoryDto {
  @IsOptional()
  @IsString({ message: 'Tên danh mục phải là chuỗi.' })
  @MaxLength(255, { message: 'Tên danh mục không được vượt quá 255 ký tự.' })
  @ApiProperty({ example: 'Giày nữ', required: false })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi.' })
  @ApiProperty({ example: 'Giày dép thời trang', required: false })
  description?: string;

  @IsOptional()
  @IsString({ message: 'parentId phải là chuỗi.' })
  @ApiProperty({ example: null, required: false })
  parentId?: string;
}

