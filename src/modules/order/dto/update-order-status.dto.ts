import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({ example: 'PROCESSING', description: 'Trạng thái mới của đơn hàng' })
  status: string;
}
