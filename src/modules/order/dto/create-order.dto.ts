import { IsString, IsNumber, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderDto {
  @IsNumber()
  @ApiProperty({ example: 100000 })
  totalAmount: number;

  @IsString()
  @ApiProperty({ example: 'COD' })
  paymentMethod: string;

  @IsString()
  @ApiProperty({ example: 'uuid-address' })
  shippingAddressId: string;

  @IsArray()
  @ApiProperty({
    type: 'array',
    example: [
      { productId: 'uuid-prod', variantId: 'uuid-variant', quantity: 1, price: 50000 },
    ],
  })
  items: Array<{ productId: string; variantId: string; quantity: number; price: number }>;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'PENDING', required: false })
  status?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'SALE', required: false })
  couponCode?: string;

  @IsOptional()
  @IsNumber()
  @ApiProperty({ example: 50000, required: false })
  useCashbackAmount?: number;
}

