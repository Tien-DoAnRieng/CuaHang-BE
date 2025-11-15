import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Cart')
@ApiBearerAuth('access-token')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  // Lấy giỏ hàng của người đang đăng nhập
  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Lấy giỏ hàng của user (me)' })
  getMyCart(@Req() req: any) {
    const userId = req.user?.id;
    return this.cartService.getUserCart(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('add')
  @ApiOperation({ summary: 'Thêm sản phẩm vào giỏ hàng (user hiện tại)' })
  @ApiBody({ schema: {
      properties: {
        variantId: { type: 'string' },
        quantity: { type: 'number' },
      },
  }})
  addItem(@Req() req: any, @Body() body: { variantId: string; quantity: number }) {
    const userId = req.user?.id;
    return this.cartService.addItem(userId, body.variantId, body.quantity);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update')
  @ApiOperation({ summary: 'Cập nhật số lượng sản phẩm trong giỏ (user hiện tại)' })
  updateItem(@Req() req: any, @Body() body: { variantId: string; quantity: number }) {
    const userId = req.user?.id;
    return this.cartService.updateItem(userId, body.variantId, body.quantity);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':variantId')
  @ApiOperation({ summary: 'Xóa sản phẩm khỏi giỏ hàng (user hiện tại)' })
  removeItem(@Req() req: any, @Param('variantId') variantId: string) {
    const userId = req.user?.id;
    return this.cartService.removeItem(userId, variantId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  @ApiOperation({ summary: 'Xóa toàn bộ giỏ hàng của user hiện tại' })
  clearCart(@Req() req: any) {
    const userId = req.user?.id;
    return this.cartService.clearCart(userId);
  }
}
