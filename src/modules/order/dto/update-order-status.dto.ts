import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { OrderStatus } from '../../../common/enums/order-status.enum';

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  @ApiProperty({ example: OrderStatus.PROCESSING, enum: OrderStatus, description: 'Trạng thái mới của đơn hàng' })
  status: OrderStatus;
}
