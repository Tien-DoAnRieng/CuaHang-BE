import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateOrderDto {
  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  shippingAddressId?: string;
}
