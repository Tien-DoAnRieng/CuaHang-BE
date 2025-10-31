import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateWishlistDto {
  @ApiProperty({ example: 'product-uuid', description: 'ID sản phẩm muốn thêm vào wishlist' })
  @IsUUID()
  productId: string;
}
