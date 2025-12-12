import { IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { DiscountType } from '../../../common/enums/discount.enum';

export class CreateFlashSaleItemDto {
  @IsUUID()
  productVariantId: string;

  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsNumber()
  discountValue: number;

  @IsOptional()
  @IsNumber()
  originalPrice?: number; // Optional - sẽ tự động lấy từ variant nếu không có

  @IsOptional()
  @IsNumber()
  quantity?: number; // thêm

  @IsOptional()
  @IsString()
  note?: string;
}
