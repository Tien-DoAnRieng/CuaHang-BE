import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiParam } from '@nestjs/swagger';
import { CartService } from './cart.service';

@ApiTags('Cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Lấy giỏ hàng của user' })
  getCart(@Param('userId') userId: string) {
    return this.cartService.getUserCart(userId);
  }

  @Post('add')
  @ApiOperation({ summary: 'Thêm sản phẩm vào giỏ hàng' })
  @ApiBody({ schema: {
      properties: {
        userId: { type: 'string' },
        variantId: { type: 'string' },
        quantity: { type: 'number' },
      },
  }})
  addItem(@Body() body: { userId: string; variantId: string; quantity: number }) {
    return this.cartService.addItem(body.userId, body.variantId, body.quantity);
  }

  @Put('update')
  @ApiOperation({ summary: 'Cập nhật số lượng sản phẩm trong giỏ' })
  updateItem(@Body() body: { userId: string; variantId: string; quantity: number }) {
    return this.cartService.updateItem(body.userId, body.variantId, body.quantity);
  }

  @Delete(':userId/:variantId')
  @ApiOperation({ summary: 'Xóa sản phẩm khỏi giỏ hàng' })
  removeItem(@Param('userId') userId: string, @Param('variantId') variantId: string) {
    return this.cartService.removeItem(userId, variantId);
  }

  @Delete('clear/:userId')
  @ApiOperation({ summary: 'Xóa toàn bộ giỏ hàng của user' })
  clearCart(@Param('userId') userId: string) {
    return this.cartService.clearCart(userId);
  }
}
