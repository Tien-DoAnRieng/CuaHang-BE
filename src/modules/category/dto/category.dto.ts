import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';

/** DTO dùng cho việc TẠO danh mục mới */
export class CreateCategoryDto {
  @IsNotEmpty({ message: 'Tên danh mục không được để trống.' })
  @IsString({ message: 'Tên danh mục phải là chuỗi.' })
  @MaxLength(255, { message: 'Tên danh mục không được vượt quá 255 ký tự.' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi.' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'parentId phải là chuỗi.' })
  parentId?: string;
}

/** DTO dùng cho việc CẬP NHẬT danh mục */
export class UpdateCategoryDto {
  @IsOptional()
  @IsString({ message: 'Tên danh mục phải là chuỗi.' })
  @MaxLength(255, { message: 'Tên danh mục không được vượt quá 255 ký tự.' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi.' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'parentId phải là chuỗi.' })
  parentId?: string;
}

