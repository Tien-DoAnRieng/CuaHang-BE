import { ApiProperty } from '@nestjs/swagger';

export class UpdatePaymentStatusDto {
  @ApiProperty({ example: 'COMPLETED', description: 'Trạng thái mới của thanh toán' })
  status: string;
}
