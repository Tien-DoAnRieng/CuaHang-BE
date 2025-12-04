import { IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { DiscountType } from '../../../common/enums/discount.enum';

export class CreateFlashSaleItemDto {
  @IsUUID()
  productVariantId: string;

  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsNumber()
  discountValue: number;


  @IsNumber()
  originalPrice: number

  @IsOptional()
  @IsNumber()
  quantity?: number; // thêm

  @IsOptional()
  @IsString()
  note?: string;
}
