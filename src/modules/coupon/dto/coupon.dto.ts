import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEnum, IsNumber, IsOptional, IsDateString, Min, Max } from 'class-validator';
import { DiscountType } from '../../../common/enums/discount.enum';

export class CreateCouponDto {
  @ApiProperty({ description: 'Mã giảm giá (phải unique)', example: 'SALE2024' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Tên mã giảm giá', example: 'Khuyến mãi năm mới' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Mô tả mã giảm giá' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Loại giảm giá', enum: DiscountType, example: 'PERCENT' })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @ApiProperty({ description: 'Giá trị giảm giá', example: 10 })
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiPropertyOptional({ description: 'Đơn hàng tối thiểu để áp dụng', example: 100000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional({ description: 'Giảm giá tối đa (cho loại PERCENT)', example: 50000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  maxDiscountAmount?: number;

  @ApiPropertyOptional({ description: 'Ngày bắt đầu (ISO string)', example: '2024-01-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Ngày kết thúc (ISO string)', example: '2024-12-31T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Giới hạn số lần sử dụng (0 = không giới hạn)', example: 1000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  usageLimit?: number;

  @ApiPropertyOptional({ description: 'Giới hạn số lần sử dụng mỗi user (0 = không giới hạn)', example: 1 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  usageLimitPerUser?: number;

  @ApiPropertyOptional({ description: 'Trạng thái', example: 'ACTIVE' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Danh sách category IDs (JSON array string)', example: '["cat1", "cat2"]' })
  @IsString()
  @IsOptional()
  applicableCategories?: string;

  @ApiPropertyOptional({ description: 'Danh sách product IDs (JSON array string)', example: '["prod1", "prod2"]' })
  @IsString()
  @IsOptional()
  applicableProducts?: string;
}

export class UpdateCouponDto {
  @ApiPropertyOptional({ description: 'Tên mã giảm giá' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Mô tả mã giảm giá' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Loại giảm giá', enum: DiscountType })
  @IsEnum(DiscountType)
  @IsOptional()
  discountType?: DiscountType;

  @ApiPropertyOptional({ description: 'Giá trị giảm giá' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  discountValue?: number;

  @ApiPropertyOptional({ description: 'Đơn hàng tối thiểu để áp dụng' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional({ description: 'Giảm giá tối đa (cho loại PERCENT)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  maxDiscountAmount?: number;

  @ApiPropertyOptional({ description: 'Ngày bắt đầu (ISO string)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Ngày kết thúc (ISO string)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Giới hạn số lần sử dụng (0 = không giới hạn)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  usageLimit?: number;

  @ApiPropertyOptional({ description: 'Giới hạn số lần sử dụng mỗi user (0 = không giới hạn)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  usageLimitPerUser?: number;

  @ApiPropertyOptional({ description: 'Trạng thái' })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiPropertyOptional({ description: 'Danh sách category IDs (JSON array string)' })
  @IsString()
  @IsOptional()
  applicableCategories?: string;

  @ApiPropertyOptional({ description: 'Danh sách product IDs (JSON array string)' })
  @IsString()
  @IsOptional()
  applicableProducts?: string;
}
