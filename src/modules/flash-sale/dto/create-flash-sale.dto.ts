import {
  IsArray,
  IsDateString,
  IsString,
  ValidateNested,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateFlashSaleItemDto } from './add-flash-sale-item.dto';

export class CreateFlashSaleDto {
  @IsString()
  title: string;

  @IsDateString()
  startTime: string;

  @IsDateString()
  endTime: string;

  @IsBoolean()
  isActive: boolean;

  @IsUUID()
  productId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFlashSaleItemDto)
  items: CreateFlashSaleItemDto[];
}
