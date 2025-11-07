import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentDto {
  @IsString()
  @ApiProperty({ example: 'uuid-order', description: 'ID của đơn hàng cần thanh toán' })
  orderId: string;

  @IsString()
  @ApiProperty({ example: 'CREDIT_CARD', description: 'Phương thức thanh toán' })
  paymentMethod: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ example: 'COMPLETED', required: false, description: 'Trạng thái thanh toán (nếu muốn ghi đè)' })
  status?: string;
}
