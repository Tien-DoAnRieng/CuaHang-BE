import { IsString, IsNotEmpty, IsOptional, MaxLength, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMemberTypeDto {
  @IsNotEmpty({ message: 'Tên loại thành viên không được để trống.' })
  @IsString({ message: 'Tên loại thành viên phải là chuỗi.' })
  @MaxLength(255, { message: 'Tên loại thành viên không được vượt quá 255 ký tự.' })
  @ApiProperty({ example: 'potential', description: 'Tên loại thành viên' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Mô tả phải là chuỗi.' })
  @ApiProperty({ example: 'Khách hàng tiềm năng', required: false })
  description?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Số đơn hàng tối thiểu phải là số.' })
  @Min(0, { message: 'Số đơn hàng tối thiểu không được âm.' })
  @ApiProperty({ example: 5, required: false, description: 'Số đơn hàng tối thiểu' })
  minOrders?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Tổng chi tiêu tối thiểu phải là số.' })
  @Min(0, { message: 'Tổng chi tiêu tối thiểu không được âm.' })
  @ApiProperty({ example: 1000000, required: false, description: 'Tổng chi tiêu tối thiểu' })
  minSpent?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Phần trăm giảm giá phải là số.' })
  @Min(0, { message: 'Phần trăm giảm giá không được âm.' })
  @ApiProperty({ example: 5, required: false, description: 'Phần trăm giảm giá' })
  discountPercent?: number;
}

export class UpdateMemberTypeDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiProperty({ required: false })
  name?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty({ required: false })
  minOrders?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty({ required: false })
  minSpent?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiProperty({ required: false })
  discountPercent?: number;
}

